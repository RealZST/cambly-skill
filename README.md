# Cambly Lesson Review Skill

A coding agent skill that reviews your Cambly lesson transcripts — surfacing idioms, phrasal verbs, and expressions worth remembering from your tutor's speech.

🧩 **Includes a Chrome extension** to save lesson transcripts locally.

> **中文文档 →** [docs/README_zh.md](docs/README_zh.md)

---

## How It Works

```
Cambly Replay Page  ──>  Chrome Extension  ──>  JSON transcript  ──>  Review Skill  ──>  Vocabulary report
```

1. **Save** — The Chrome extension scrapes your lesson replay and saves the transcript as a structured JSON file.
2. **Review** — The skill reads the transcript, assesses your level, and recommends expressions from your tutor's speech — with context, examples, and native-language explanations.

---

## 📥 Part 1: Chrome Extension

### Setup

You can install the extension in either of these ways:

- Chrome Web Store: [Cambly Transcript Scraper](https://chromewebstore.google.com/detail/hjlokdjlccekhngaplmeefmojkhpkibb?utm_source=item-share-cb)
- Local install from this repository:
  1. Clone or download this repository
  2. Open `chrome://extensions/` in Chrome
  3. Enable **Developer mode** (top-right toggle)
  4. Click **Load unpacked** and select the `extension/` folder

### Usage

1. Log in to [Cambly](https://www.cambly.com) and open a **lesson replay** page
2. Click the extension icon in the toolbar
3. Click **Scrape & Save**
4. A JSON file is saved to `~/Downloads/cambly-transcripts/`

Files are named automatically: `cambly-2026-03-15-tutor_name.json`

> **Note:** You can change the save folder in the extension popup, but make sure to also update the path in `skill/SKILL.md` so the skill can find your files.

> **Known issue:** The [Chrono Download Manager](https://chromewebstore.google.com/detail/chrono-download-manager/mciiogijehkdemklbdcbfkefimifhecn) extension can cause files to save with UUID filenames instead of the expected format. Disable Chrono before using this extension.

---

## 📝 Part 2: Review Skill

### Install

Via [skills.sh](https://skills.sh):

```bash
npx skills add RealZST/cambly-skill
```

Manual:

Clone (or [download](https://github.com/RealZST/cambly-skill/archive/refs/heads/main.zip)) this repository, then copy the `skill/` folder into your agent's skills directory:

```bash
git clone https://github.com/RealZST/cambly-skill.git
cd cambly-skill

# Claude Code
cp -r skill ~/.claude/skills/cambly-review

# Codex
cp -r skill ~/.codex/skills/cambly-review

# Gemini CLI
cp -r skill ~/.gemini/skills/cambly-review

# OpenClaw
cp -r skill ~/.openclaw/skills/cambly-review

# Cursor / Windsurf / other agents
# Copy the skill/ folder into the agent's skill directory
```

### Usage

The skill accepts transcripts in three ways:

1. **Auto-find** — just ask to review and the skill searches `~/Downloads/cambly-transcripts/` automatically
2. **Provide a custom path** — point to a transcript file anywhere on your machine
3. **Attach a file** — send the transcript file directly to your coding agent

Example prompts:

- *"Review my Cambly lesson"*
- *"What phrases should I remember from my March 15 lesson?"*
- *"Review my lessons with Jane"*
- *"Review last 3 lessons"*
- *"Review this week's lessons"*

### What the skill does

| Step | Description |
|------|-------------|
| **Find** | Locates the right transcript by date, tutor, or time range |
| **Assess** | Reads your speech to gauge your English level |
| **Extract** | Picks out idioms, phrasal verbs, and collocations from your **tutor's** speech |
| **Present** | Shows each expression with original sentence, context, examples, and a native-language explanation |

The skill filters out expressions that are too simple for your level, but keeps advanced ones.

### Example output

> **1. hit the ground running**
> - **Original sentence**: "You really hit the ground running with that project."
> - **Timestamp**: 12:34
> - **Context**: Discussing how the student started a new job and adapted quickly.
> - **Examples**:
>   1. She hit the ground running in her new role and impressed everyone.
>   2. We need someone who can hit the ground running without much training.
>   3. After the onboarding, he hit the ground running on the first day.
>
> > Meaning: Describes someone who adapts quickly and starts working effectively right away.

The explanation language adapts automatically — ask in Chinese and you'll get a Chinese explanation, in Spanish a Spanish one, etc.

---

## Disclaimer

This project is **not affiliated with or endorsed by Cambly**. It is an independent tool built for personal language learning.

The extension simply reads transcript data from the page you already have open in your browser — it does not send any additional network requests, access private APIs, or modify your account in any way.

## License

[MIT](LICENSE)
