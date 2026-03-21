# Cambly Lesson Review

Save your Cambly lesson transcripts locally with a Chrome extension, then use a skill to analyze your tutor's speech and surface the idioms, phrasal verbs, and expressions worth remembering.

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

> **Note:** You can change the save folder in the extension popup, but make sure to also update the path in `skill/cambly-review.md` so the skill can find your files.

> **Known issue:** The [Chrono Download Manager](https://chromewebstore.google.com/detail/chrono-download-manager/mciiogijehkdemklbdcbfkefimifhecn) extension can cause files to save with UUID filenames instead of the expected format. Disable Chrono before using this extension.

---

## 📝 Part 2: Review Skill

Once you have a transcript, just ask your coding agent to review it — in any language:

- *"Review my Cambly lesson from yesterday"*
- *"What phrases should I remember from my March 15 lesson?"*
- *"Review last week's lessons"*

### What the skill does

| Step | Description |
|------|-------------|
| **Find** | Locates the right transcript by date, tutor, or time range |
| **Assess** | Reads your speech to gauge your English level |
| **Extract** | Picks out idioms, phrasal verbs, and collocations from your **tutor's** speech |
| **Present** | Shows each expression with original sentence, context, examples, and a native-language explanation |

The skill filters out expressions that are too simple for your level, but keeps advanced ones.

### Skill setup

Copy the skill file to whichever coding agent you use:

<details>
<summary><strong>OpenClaw</strong></summary>

```bash
mkdir -p ~/.openclaw/skills/cambly-review
cp skill/cambly-review.md ~/.openclaw/skills/cambly-review/SKILL.md
```
</details>

<details>
<summary><strong>Claude Code</strong></summary>

```bash
mkdir -p ~/.claude/skills/cambly-review
cp skill/cambly-review.md ~/.claude/skills/cambly-review/SKILL.md
```
</details>

<details>
<summary><strong>Codex CLI</strong></summary>

```bash
mkdir -p ~/.codex/skills/cambly-review
cp skill/cambly-review.md ~/.codex/skills/cambly-review/SKILL.md
```
</details>

<details>
<summary><strong>Gemini CLI</strong></summary>

```bash
mkdir -p ~/.gemini/skills/cambly-review
cp skill/cambly-review.md ~/.gemini/skills/cambly-review/SKILL.md
```
</details>

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

## License

MIT
