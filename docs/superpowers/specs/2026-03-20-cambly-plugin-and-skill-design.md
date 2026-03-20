# Cambly Transcript Scraper + Review Skill — Design Spec

## Overview

Two deliverables:
1. **Chrome Extension (MV3)** — scrapes "语音转文字" transcripts from Cambly replay pages, distinguishes teacher/student, saves as JSON + Markdown locally.
2. **AI Skill** — a Markdown instruction file that Claude Code / Codex / OpenClaw can use to analyze saved transcripts and recommend vocabulary/phrases for review.

---

## 1. Chrome Extension

### Architecture

- **Manifest V3** with `activeTab` and `downloads` permissions.
- **Popup** (`popup.html` + `popup.js`) — settings UI + trigger button.
- **Content Script** (`content.js`) — injected into Cambly replay pages, handles DOM scraping.

### Popup UI

- Text input: "Student Name" (persisted to `chrome.storage.local`).
- Text input: "Save Folder" with a default hint of "Downloads" (uses `chrome.downloads` API with `saveAs` or configured subdirectory).
- Button: "Scrape Transcript" — sends message to content script, receives data, triggers download.
- Status area: shows success/error messages.

### Content Script — DOM Scraping

Based on observed DOM structure from screenshots:

```
div._box (row)
  ├── div._avatar
  │     └── img[alt="Tracie can Teach 的头像"]   ← speaker identity
  └── div._inlineBlock
        └── div[role="button"]
              └── p._typography  ← transcript text
```

**Speaker identification:**
- Extract `img[alt]` text from each row's avatar.
- Compare against configured student name → if match, mark as `student`; otherwise mark as `teacher`.
- Store teacher name from the first non-student speaker encountered.

**Scroll handling:**
- The transcript may lazy-load. Content script scrolls the transcript container to bottom in a loop until no new content appears (MutationObserver + scroll interval).

**Timestamp extraction:**
- Check if timestamps exist in DOM (time elements or data attributes near each message).
- If not directly available, attempt to extract from video player position mapping or leave as empty string.

### Output Format

**JSON** (`cambly-YYYY-MM-DD.json`):
```json
{
  "meta": {
    "date": "2026-03-20",
    "teacher": "Tracie can Teach",
    "student": "Zoe",
    "duration": "30:23",
    "url": "https://cambly.com/en/student/replay/..."
  },
  "transcript": [
    {
      "speaker": "teacher",
      "name": "Tracie can Teach",
      "text": "Wow. That is pretty cool.",
      "timestamp": "1:37"
    }
  ]
}
```

**Markdown** (`cambly-YYYY-MM-DD.md`):
```markdown
# Cambly Lesson — 2026-03-20
Teacher: Tracie can Teach | Student: Zoe | Duration: 30:23

---

[1:37] **[Teacher]** Wow. That is pretty cool.
[1:42] **[Student]** emperor, yeah, for one emperor...
```

Both files download simultaneously via `chrome.downloads.download()`.

### File Naming & Path

- Default: browser Downloads folder.
- Custom path: user enters a subdirectory name (e.g., `cambly-lessons`), extension appends it via `filename` option in `chrome.downloads.download()`.
- File names: `cambly-YYYY-MM-DD.json` / `cambly-YYYY-MM-DD.md`.
- If multiple lessons on same date, append index: `cambly-YYYY-MM-DD-2.json`.

### Permissions

```json
{
  "permissions": ["activeTab", "downloads", "storage"],
  "host_permissions": ["https://www.cambly.com/*"]
}
```

---

## 2. AI Skill

### File

`skill/cambly-review.md` — a self-contained Markdown instruction file.

### Behavior

When invoked, the skill:

1. Asks user which lesson to review (date or "yesterday" / "last lesson").
2. Reads the corresponding JSON file from the configured transcript directory.
3. Assesses the student's English level from the student's utterances.
4. Scans **teacher utterances only** for:
   - Idioms
   - Phrasal verbs
   - Useful oral expressions
   - Vocabulary slightly above the assessed student level
5. Outputs a list of recommended items, each containing:
   - The phrase/word
   - Teacher's full original sentence
   - Timestamp
   - Conversation topic/context
   - 2–3 additional example sentences

### Compatibility

The skill file uses standard Markdown with YAML frontmatter — compatible with Claude Code skills, Codex custom instructions, and OpenClaw skills.

---

## 3. Error Handling

- **Not on Cambly replay page**: popup shows "Please navigate to a Cambly lesson replay page."
- **Transcript tab not active**: content script clicks the "语音转文字" tab automatically, or prompts user.
- **No messages found**: popup shows "No transcript found. Make sure the 语音转文字 tab is visible."
- **Student name not set**: popup prompts to enter student name before scraping.

---

## 4. File Structure

```
cambly-skill/
├── extension/
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   ├── content.js
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── skill/
│   └── cambly-review.md
├── PRD.md
└── docs/superpowers/specs/
    └── 2026-03-20-cambly-plugin-and-skill-design.md
```
