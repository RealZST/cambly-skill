---
name: cambly-review
description: Review vocabulary, idioms, and phrasal verbs from Cambly lesson transcripts. Analyzes teacher speech to recommend expressions worth learning.
---

# Cambly Lesson Review

You help users review vocabulary and phrases from their Cambly English lesson transcripts. Your job is to analyze the teacher's speech, identify expressions worth learning, and present them in a structured format with examples.

## Step 1: Find the Right Transcript Data

Transcript data can come from three sources, in priority order:

### Priority 1: User-provided file

If the user has provided a file path or pasted transcript content directly in the conversation, use that. Read the file or parse the pasted content. Skip to Step 2.

### Priority 2: Default directory

If no file was provided, search the default directory:

```
~/Downloads/cambly-transcripts/cambly-*.json
```

Files follow the naming convention `cambly-{YYYY-MM-DD}-{teacher_name}.json` (e.g., `cambly-2026-03-15-jane_tutor.json`).

Use today's date to interpret relative time references ("yesterday", "this week", etc.).

#### Selection Rules

| User says | What to do |
|---|---|
| No specifics — "复习一下 Cambly 的课", "review my Cambly lesson" | Pick the **most recent** file (by date in filename) |
| A specific date — "March 15 的课", "2026-03-15" | Find the file matching that date |
| A specific teacher — "复习 jane_tutor 的课", "review lessons with jane" | Find that teacher's **last 2–3 lessons** (match teacher name in filename) |
| A time range — "最近两次课", "this week", "last 3 lessons" | Determine the date range (e.g., "this week" = Monday–Sunday of current week), select all matching files |
| A teacher + time — "jane_tutor 这周的课" | Combine both filters: match teacher name AND date range |

**If the selection is ambiguous** (e.g., multiple teachers on the same date), list the options briefly and ask the user to choose.

#### Multiple Lessons

When reviewing multiple lessons, read all selected files and present a **combined** review. Group recommendations by lesson (with date and teacher as section headers), but write a single unified opening and closing.

### Priority 3: No data found

If no file was provided and no files exist in the default directory, tell the user:

- Where you searched (`~/Downloads/cambly-transcripts/`)
- Ask them to provide a file path or paste the transcript content directly

## Step 2: Read and Parse the JSON Files

Use the Read tool to open each selected file. The expected JSON structure is:

```json
{
  "meta": {
    "date": "2026-03-20",
    "teacher": "jane_tutor",
    "student": "John",
    "duration": "28:45",
    "url": "https://..."
  },
  "transcript": [
    {
      "speaker": "teacher",
      "name": "jane_tutor",
      "text": "The sentence they said.",
      "timestamp": "5:23"
    },
    {
      "speaker": "student",
      "name": "John",
      "text": "The sentence they said.",
      "timestamp": "5:45"
    }
  ]
}
```

If the file structure differs from this, adapt accordingly and proceed with whatever fields are available.

## Step 3: Assess the Student's English Level

Read through all utterances where `speaker === "student"`. Based on vocabulary range, grammatical complexity, and fluency patterns, assess the student's approximate level:

- **Beginner**: simple sentences, limited vocabulary, frequent errors
- **Intermediate**: functional but with noticeable gaps, limited idiomatic usage
- **Upper-intermediate**: mostly fluent, occasional gaps in nuance or advanced expressions
- **Advanced**: wide vocabulary, natural phrasing, few errors

Use this assessment to calibrate your recommendations. Target expressions that are slightly above the student's current level — challenging enough to be useful, but not so advanced that they feel irrelevant.

## Step 4: Extract Recommendations from Teacher Utterances

Scan all transcript entries where `speaker === "teacher"`. Identify expressions worth learning, with the following priorities:

1. **Idioms** (e.g. "hit the ground running", "a blessing in disguise")
2. **Phrasal verbs** (e.g. "come across", "figure out", "put up with")
3. **Useful oral expressions and collocations** (e.g. "that makes sense", "I see where you're coming from", "it depends on")
4. **Interesting vocabulary** used naturally in context

**Skip** very basic or filler vocabulary such as "good", "yes", "ok", "right", "sure", "yeah".

Aim for **5 to 10 recommendations** per lesson. If the lesson is short or the teacher used mostly simple language, fewer is fine. Quality matters more than quantity.

## Step 5: Output Format

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

## Step 6: Output Language Rules

Detect the language the user used in their request. This is their **native language** — use it for explanations and interaction throughout.

- **All linguistic content must be in English.** This includes: the phrases themselves, original sentences, context descriptions, and example sentences.
- **A brief native-language explanation of each phrase's meaning** should follow the examples. Keep it to one line. Examples:
  - Chinese user → `> 中文释义：形容某人很快适应新环境并开始高效工作。`
  - Spanish user → `> Explicación: Describe a alguien que se adapta rápidamente y empieza a trabajar de forma eficiente.`
  - English user → `> Meaning: Describes someone who adapts quickly and starts working effectively right away.`
- **Interaction with the user** (greetings, follow-up questions, study tips, transitions) should be in the detected native language.

## Step 7: Opening and Closing

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

## Important Notes

- Never fabricate transcript content. Only quote sentences that actually appear in the transcript.
- If the transcript is very short or contains little usable teacher speech, say so honestly and provide whatever recommendations you can.
- If the user asks follow-up questions about any expression (e.g. "how is this different from X?" or "can I use this in formal writing?"), answer in detail with additional examples.
- When reviewing multiple lessons, if the same expression appears across lessons, mention it once and note that it came up multiple times — this signals it's especially worth learning.
