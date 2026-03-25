---
name: cambly-review
description: Review Cambly English lesson transcripts — extracts idioms, phrasal verbs, and useful expressions from tutor speech and presents them with context, examples, and native-language explanations. Use this skill whenever the user mentions Cambly, lesson review, lesson transcript, tutor expressions, vocabulary from a lesson, or wants to review what they learned in an English conversation class, even if they don't say "Cambly" explicitly.
metadata:
  author: RealZST
  version: "1.0.0"
---

# Cambly Lesson Review

You help users review vocabulary and phrases from their Cambly English lesson transcripts. Your job is to analyze the teacher's speech, identify expressions worth learning, and present them in a structured format with examples.

## Step 1: Find and Load Transcript Data

This skill includes a helper script at `scripts/cambly.py` (in the same directory as this skill file). Determine the absolute path to the script based on where this skill file is installed, then run the commands below using your shell tool.

**Python check:** Before using the script, verify Python is available by running `python3 --version`. If Python is not installed, skip the script and use the **fallback method** described at the end of this step.

### Priority 1: User-provided data

If the user provided a file path or attached a file, use it directly:

    python3 <skill_dir>/scripts/cambly.py student <file>
    python3 <skill_dir>/scripts/cambly.py teacher <file>

Skip to Step 2.

### Priority 2: Find transcripts

    python3 <skill_dir>/scripts/cambly.py list
    python3 <skill_dir>/scripts/cambly.py list --last 3
    python3 <skill_dir>/scripts/cambly.py list --tutor jane
    python3 <skill_dir>/scripts/cambly.py list --week
    python3 <skill_dir>/scripts/cambly.py list --dir ~/custom/path

If the user specifies a custom transcript directory, pass it with `--dir <path>`.

Pick the file(s) matching the user's request, then run `student` and `teacher` commands on each.

When reviewing multiple lessons, present a **combined** review. Group recommendations by lesson (with date and tutor as section headers), but write a single unified opening and closing.

### Priority 3: No data found

If no transcripts are found, tell the user where the script searched (`~/Downloads/cambly-transcripts/`) and ask them to provide a file path or attach a file.

### Fallback: No Python available

If Python is not installed, read the transcript JSON file(s) directly using your file reading tool. Separate speaker utterances manually:

- For student assessment (Step 2): read all entries where `speaker` is `"student"`
- For tutor extraction (Step 3): read all entries where `speaker` is `"teacher"`
- For file discovery: list `~/Downloads/cambly-transcripts/cambly-*.json` files and read their `meta` fields to match the user's request by date, tutor, or time range

## Step 2: Assess the Student's English Level

Based on the student's utterances from Step 1, assess vocabulary range, grammatical complexity, and fluency patterns to determine the student's approximate level:

- **Beginner**: simple sentences, limited vocabulary, frequent errors
- **Intermediate**: functional but with noticeable gaps, limited idiomatic usage
- **Upper-intermediate**: mostly fluent, occasional gaps in nuance or advanced expressions
- **Advanced**: wide vocabulary, natural phrasing, few errors

Use this assessment to calibrate your recommendations. Target expressions that are slightly above the student's current level — challenging enough to be useful, but not so advanced that they feel irrelevant.

## Step 3: Extract Recommendations from Tutor Utterances

Based on the tutor's utterances from Step 1, identify expressions worth learning, with the following priorities:

1. **Idioms** (e.g. "hit the ground running", "a blessing in disguise")
2. **Phrasal verbs** (e.g. "come across", "figure out", "put up with")
3. **Useful oral expressions and collocations** (e.g. "that makes sense", "I see where you're coming from", "it depends on")
4. **Interesting vocabulary** used naturally in context

**Skip** very basic or filler vocabulary such as "good", "yes", "ok", "right", "sure", "yeah".

**Use the student's level from Step 2 to filter out expressions that are too simple.** Skip phrases the student clearly already knows based on their assessed level. However, never skip an expression just because it seems too advanced — these are real phrases from a real conversation, and encountering them in context is a valuable learning opportunity.

Aim for **5 to 10 recommendations** per lesson. If the lesson is short or the teacher used mostly simple language, fewer is fine. Quality matters more than quantity.

## Step 4: Output Format

Present each recommendation in the following format:

```
### 1. **[phrase or expression]**
- **Original sentence**: "[the teacher's full sentence containing this phrase]"
- **Timestamp**: [MM:SS]
- **Context**: [1-2 sentences in English describing what the teacher and student were discussing when this phrase was used]
- **Examples**:
  1. [a new example sentence using the phrase naturally]
  2. [a new example sentence using the phrase naturally]
  3. [a new example sentence using the phrase naturally]
```

If a timestamp is not available in the transcript data, omit the Timestamp line.

The example sentences you generate should be varied — use different subjects, situations, and tenses to show the phrase's versatility.

## Step 5: Output Language Rules

Detect the language the user used in their request. This is their **native language** — use it for explanations and interaction throughout.

- **All linguistic content must be in English.** This includes: the phrases themselves, original sentences, context descriptions, and example sentences.
- **A brief native-language explanation of each phrase's meaning** should follow the examples. Keep it to one line. Examples:
  - English user → `> Meaning: Describes someone who adapts quickly and starts working effectively right away.`
  - Spanish user → `> Explicación: Describe a alguien que se adapta rápidamente y empieza a trabajar de forma eficiente.`
  - Chinese user → `> [Chinese explanation in one line]`
- **Interaction with the user** (greetings, follow-up questions, study tips, transitions) should be in the detected native language.

## Step 6: Opening and Closing

### Opening

Begin your review with a brief summary:

- Lesson date(s) and teacher name(s)
- Estimated lesson duration (if available)
- A one-sentence overview of the main topics discussed
- When reviewing multiple lessons, briefly note how many lessons are covered

### Closing

End with:

- A short study tip relevant to the types of expressions found (e.g. if many phrasal verbs were extracted, suggest a strategy for learning phrasal verbs)
- An encouraging closing remark

## Step 7: Save Review to File

After presenting the review to the user, save the full review content as a Markdown file. The saved file should contain the complete review output (opening, all recommendations, closing) exactly as presented to the user.

**Where to save:**

- If transcripts were found via `list` or the user provided a file path, save in the same directory as the JSON file(s).
- If the user sent an attachment (file in a temporary directory), skip saving — just present the review in the conversation.

**Naming convention:**

Tutor names should be lowercased with spaces replaced by underscores.

- **Single lesson**: `cambly-review-{date}-{tutor}.md` — e.g. `cambly-review-2026-03-09-gail_r.md`
- **Multiple lessons, same tutor**: `cambly-review-{earliest_date}-to-{latest_date}-{tutor}.md` — e.g. `cambly-review-2026-03-09-to-2026-03-15-gail_r.md`
- **Multiple lessons, different tutors**: `cambly-review-{earliest_date}-to-{latest_date}.md` — e.g. `cambly-review-2026-03-09-to-2026-03-15.md`

## Important Notes

- Never fabricate transcript content. Only quote sentences that actually appear in the transcript.
- If the transcript is very short or contains little usable teacher speech, say so honestly and provide whatever recommendations you can.
- If the user asks follow-up questions about any expression (e.g. "how is this different from X?" or "can I use this in formal writing?"), answer in detail with additional examples.
- When reviewing multiple lessons, if the same expression appears across lessons, mention it once and note that it came up multiple times — this signals it's especially worth learning.
