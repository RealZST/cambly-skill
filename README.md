# Cambly Lesson Review

Save your Cambly lesson transcripts locally, then use an AI skill to review key vocabulary, idioms, and phrasal verbs from your teacher's speech.

> **中文文档 →** [docs/README_zh.md](docs/README_zh.md)

## What This Project Does

This project has two parts:

1. **Chrome Extension** — Scrapes the transcript from a Cambly lesson replay page and saves it as a JSON file on your computer.
2. **Review Skill** — An AI skill (for [OpenClaw](https://github.com/anthropics/openclaw), Claude Code, Codex, etc.) that reads your saved transcripts and helps you review what your teacher said — highlighting useful phrases, idioms, and expressions worth remembering.

## Part 1: Chrome Extension

### Setup

1. Clone or download this repository
2. Open `chrome://extensions/` in Chrome
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the `extension/` folder

### Usage

1. Log in to [Cambly](https://www.cambly.com) and open a **lesson replay** page
2. Click the extension icon in the toolbar
3. Click **Scrape & Save**
4. A JSON file is saved to your Downloads folder under `cambly-transcripts/`

The file is named like `cambly-2026-03-15-jane_tutor.json` — the lesson date and teacher name are extracted automatically.

### Note: Folder Name and Skill Sync

Files are saved to `~/Downloads/cambly-transcripts/` by default. You can change the folder name in the extension popup, but if you do, you must also update the path in `skill/cambly-review.md` to match — otherwise the review skill won't find your files.

### Known Issue: Chrono Download Manager

If you have the **Chrono Download Manager** extension installed, downloaded files will have UUID-based filenames (e.g., `a57ec8de-c1d2-4c67-a60c-7781de56d48b.json`) instead of the expected format.

**Workaround:** Disable Chrono before using this extension. You can re-enable it afterward.

## Part 2: Review Skill

After saving a transcript, you can review it with the included AI skill. Just ask naturally:

- *"Review my Cambly lesson from yesterday"*
- *"What phrases should I remember from my March 15 lesson?"*
- *"帮我复习一下昨天 Cambly 的课"*

The skill will:

1. Find the transcript file by date
2. Assess your English level from your speech
3. Pick out useful expressions from your **teacher's** speech — idioms, phrasal verbs, collocations
4. Show each expression with the original sentence, timestamp, conversation context, and example sentences

### Skill Setup

Copy `skill/cambly-review.md` to your AI tool's skill directory. For OpenClaw:

```bash
cp skill/cambly-review.md ~/.openclaw/skills/
```

### Example Output

> **1. hit the ground running**
> - **Original sentence**: "You really hit the ground running with that project."
> - **Timestamp**: 12:34
> - **Context**: Discussing how the student started a new job and adapted quickly.
> - **Examples**:
>   1. She hit the ground running in her new role and impressed everyone.
>   2. We need someone who can hit the ground running without much training.
>   3. After the onboarding, he hit the ground running on the first day.
>
> > 中文释义：形容某人很快适应新环境并开始高效工作。

## License

MIT
