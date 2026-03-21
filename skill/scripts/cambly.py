#!/usr/bin/env python3
"""Cambly transcript helper — find lessons, extract speaker utterances."""

import argparse
import json
import sys
from datetime import date, timedelta
from pathlib import Path

DEFAULT_DIR = Path.home() / "Downloads" / "cambly-transcripts"


def load_transcript(path_str):
    """Load and validate a transcript JSON file. Returns parsed dict or exits."""
    p = Path(path_str).expanduser()
    if not p.exists():
        print(f"Error: File not found: {p}")
        sys.exit(1)
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        print(f"Error: Invalid JSON in {p}")
        sys.exit(1)
    return data


def _print_no_match(args, transcript_dir, files):
    """Print a helpful no-match message with available options."""
    all_tutors = set()
    all_dates = set()
    for f in files:
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            continue
        meta = data.get("meta", {})
        if meta.get("teacher"):
            all_tutors.add(meta["teacher"])
        if meta.get("date"):
            all_dates.add(meta["date"])

    if args.tutor:
        tutors = ", ".join(sorted(all_tutors)) if all_tutors else "none"
        print(f'No transcripts found for tutor "{args.tutor}". Available tutors: {tutors}')
    elif args.date:
        dates = ", ".join(sorted(all_dates, reverse=True)) if all_dates else "none"
        print(f'No transcripts found for date {args.date}. Available dates: {dates}')
    elif args.week:
        print(f"No transcripts found for this week in {transcript_dir}")
    else:
        print(f"No transcripts found in {transcript_dir}")


def cmd_list(args):
    """Find and list transcript files with metadata."""
    transcript_dir = Path(args.dir).expanduser().resolve() if args.dir else DEFAULT_DIR
    if not transcript_dir.is_dir():
        print(f"Error: Directory not found: {transcript_dir}")
        sys.exit(1)

    files = sorted(transcript_dir.glob("cambly-*.json"))
    if not files:
        print(f"No transcripts found in {transcript_dir}")
        sys.exit(1)

    entries = []
    for f in files:
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            continue
        meta = data.get("meta", {})
        entries.append({
            "date": meta.get("date", ""),
            "tutor": meta.get("teacher", ""),
            "duration": meta.get("duration", ""),
            "path": str(f),
        })

    if args.date:
        entries = [e for e in entries if e["date"] == args.date]

    if args.tutor:
        query = args.tutor.lower()
        entries = [e for e in entries if query in e["tutor"].lower()]

    if args.week:
        today = date.today()
        monday = today - timedelta(days=today.weekday())
        sunday = monday + timedelta(days=6)
        entries = [e for e in entries if monday.isoformat() <= e["date"] <= sunday.isoformat()]

    entries.sort(key=lambda e: e["date"], reverse=True)

    if args.last:
        entries = entries[:args.last]

    if not entries:
        _print_no_match(args, transcript_dir, files)
        sys.exit(1)

    for e in entries:
        dur = e["duration"] if e["duration"] else ""
        print(f"{e['date']}  {e['tutor']}  {dur}  {e['path']}")


def cmd_utterances(file_path, speaker):
    """Print utterances for a given speaker with metadata header."""
    data = load_transcript(file_path)
    meta = data.get("meta", {})

    parts = []
    if meta.get("date"):
        parts.append(f"Date: {meta['date']}")
    if meta.get("teacher"):
        parts.append(f"Tutor: {meta['teacher']}")
    if meta.get("duration"):
        parts.append(f"Duration: {meta['duration']}")
    if parts:
        print(f"# {' | '.join(parts)}")

    for entry in data.get("transcript", []):
        if entry.get("speaker") == speaker:
            ts = entry.get("timestamp", "")
            text = entry.get("text", "").strip().replace("\n", " ")
            print(f"{ts} | {text}" if ts else f"  | {text}")


def main():
    parser = argparse.ArgumentParser(description="Cambly transcript helper")
    sub = parser.add_subparsers(dest="command")

    # list
    p_list = sub.add_parser("list", help="Find and list transcripts")
    p_list.add_argument("--last", type=int, metavar="N", help="Most recent N lessons")
    p_list.add_argument("--date", metavar="YYYY-MM-DD", help="Exact date")
    p_list.add_argument("--tutor", metavar="NAME", help="Filter by tutor name (substring)")
    p_list.add_argument("--week", action="store_true", help="This week (Mon-Sun)")
    p_list.add_argument("--dir", metavar="PATH", help="Transcript directory")

    # student
    p_stu = sub.add_parser("student", help="Output student utterances")
    p_stu.add_argument("file", help="Path to transcript JSON")

    # teacher
    p_tea = sub.add_parser("teacher", help="Output tutor utterances")
    p_tea.add_argument("file", help="Path to transcript JSON")

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        sys.exit(1)

    if args.command == "list":
        cmd_list(args)
    elif args.command == "student":
        cmd_utterances(args.file, "student")
    elif args.command == "teacher":
        cmd_utterances(args.file, "teacher")


if __name__ == "__main__":
    main()
