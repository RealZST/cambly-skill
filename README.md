# Cambly Transcript Scraper

A Chrome extension that extracts lesson transcripts from [Cambly](https://www.cambly.com) replay pages and saves them as structured JSON files.

> **中文文档 →** [docs/README_zh.md](docs/README_zh.md)

## Features

- **One-click scraping** — Extracts the full transcript from any Cambly lesson replay page
- **Automatic metadata** — Captures lesson date, teacher name, student name, and duration without manual input
- **Speaker identification** — Distinguishes teacher vs. student using avatar URL patterns
- **Timestamps** — Preserves per-message timestamps from the lesson timeline
- **Structured JSON output** — Clean, machine-readable format for downstream processing

## How It Works

1. Open a Cambly lesson replay page (`/student/progress/past-lesson?lessonV2Id=...`)
2. Click the extension icon in the toolbar
3. Click **Scrape & Save**
4. The extension automatically:
   - Switches to the **Feedback** tab to extract the lesson date and teacher name
   - Switches to the **Speech-to-Text** tab to extract the full transcript via React fiber internals
   - Downloads a JSON file to `~/Downloads/cambly-scripts/`

### Output Format

**Filename:** `cambly-{date}-{teacher}.json` (e.g., `cambly-2026-03-15-sabley01.json`)

```json
{
  "meta": {
    "date": "2026-03-15",
    "teacher": "sabley01",
    "student": "John",
    "duration": "28:45",
    "url": "https://www.cambly.com/..."
  },
  "transcript": [
    {
      "speaker": "teacher",
      "name": "sabley01",
      "text": "Hi, how are you today?",
      "timestamp": "0:03"
    },
    {
      "speaker": "student",
      "name": "John",
      "text": "I'm doing great, thanks!",
      "timestamp": "0:07"
    }
  ]
}
```

## Installation

1. Clone or download this repository
2. Open `chrome://extensions/` in Chrome
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the `extension/` folder

## Known Issues

### Chrono Download Manager Compatibility

If you have the **Chrono Download Manager** extension installed, downloaded files will have **UUID-based filenames** (e.g., `a57ec8de-c1d2-4c67-a60c-7781de56d48b.json`) instead of the expected `cambly-{date}-{teacher}.json` format.

**Why:** Chrono intercepts Chrome's `chrome.downloads.download()` API calls and cannot read the `filename` parameter. It falls back to extracting the name from the blob URL, which is a UUID.

**Workaround:** Disable Chrono (or any other third-party download manager extension) before using this extension. You can re-enable it afterward.

## Tech Stack

| Component | Details |
|---|---|
| Platform | Chrome Extension (Manifest V3) |
| Content Script | Runs in ISOLATED world — handles popup messaging |
| Page Script | Runs in MAIN world — accesses React fiber tree and DOM |
| Communication | CustomEvents between ISOLATED and MAIN worlds |
| Extraction | React fiber tree traversal for transcript data |

## License

MIT
