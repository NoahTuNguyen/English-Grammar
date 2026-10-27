# Who & When — product spec (v1)

## Users

- **Child (main user):** 6 years old, early reader, uses an iPad or phone, often alone for 5–10 minutes.
- **Parent:** sets up, sits in for "Say it aloud" and "Write one sentence" tasks, checks progress.

## Structure

The app mirrors the school workbook exactly so child, parent and teacher share the same goals.

```
Pack  (one workbook booklet, e.g. "Simple Past, Be and Have")
 ├─ objectives  (the "In this pack I will learn to" checklist)
 ├─ units       (one per workbook topic)
 │    ├─ Learn      rule card from content/rules.json
 │    └─ Practise   the unit's items
 └─ checkup     (the "Mini Check-Up": no hints, results to parent page)
```

## Screens

### Home
- Title "Who & When" and Mimi.
- The **timeline strip** across the top: three stations, Before (moon) · Now (sun) · Later (sunrise), each with one tappable example ("I played." / "I am playing." / "I shall play."). This is the app's signature visual.
- One large card per pack (from `content/packs/index.json`), showing its objectives as circles that fill in as they are mastered.
- Small "Grown-ups" button in a corner, opened by **press and hold for 2 seconds** (keeps the child out without a PIN).

### Pack
- Units listed in workbook order, each with 0–3 stars and a picture.
- "Check-up" at the bottom, unlocked once every unit has been practised at least once (parent can override).

### Learn (per unit)
Renders a rule card from `content/rules.json`.

- `who-grid` cards: the **Who grid**. Columns: I (user-circle icon), one (user icon, sub "he, she, it, Ben"), we (users icon), many (users-group icon, sub "you, they, birds"). Rows are the forms for that rule (e.g. Now: am / is / are / are). Every cell is a button; tapping it speaks its example sentence and shows it underneath.
- `time-line` cards: the three stations with clue words under each; tapping a clue speaks an example.
- `pattern` cards (spelling): base word → past word with the changing letters highlighted, e.g. cr**y** → cr**ied**.
- `list` cards (irregular verbs): word pairs, tap to hear "go, went. Yesterday I went to the park."
- A "Say it aloud" strip at the bottom (from the rule's `sayAloud`), tap to hear, child repeats.
- One button: "Let's practise".

### Practise
- One question at a time: picture (emoji in v1) above, sentence below in Andika, options as big buttons.
- Question auto-reads aloud when it appears (toggle in Grown-ups). The blank is read as a short pause.
- Small dots at top show progress through the round.
- After a correct answer: blank fills in, subject and clue highlight, full sentence is spoken, a star pops, "Next" button appears (the child controls pace).

### Done
- 1–3 stars for the round (first-try correct: ≥90% → 3, ≥60% → 2, else 1). Best stars per unit saved.
- "Play again" and "Back to pack".

### Check-up
- Same question UI, but no hints and no re-queue. A wrong answer simply moves on.
- At the end: a friendly summary for the child (stars), detailed results stored for the parent.

### Grown-ups
- Per objective: accuracy over the last 20 attempts, shown as a simple bar, plus "needs practice" if under 70%.
- "Tricky questions": items missed more than once, with the sentence and what was chosen.
- **Together tasks**: the pack's `say` items. Parent reads the prompt with the child; taps "She said it" to record it.
- Settings: read aloud on/off, voice speed (slow / normal), child's name (used in Done screen only), reset progress (with confirm).

## Item types

All items share: `id` (unique across all packs), `type`, `pic` (emoji), optional `hint` (overrides hint step 1 text).

### `pick` — circle the right word
```json
{ "id": "p1-be-03", "type": "pick", "pic": "👧👦",
  "text": "My two cousins ___ Lily and Sam.",
  "options": ["is", "are"], "answer": "are",
  "who": "many", "subject": "My two cousins" }
```
- `text` contains exactly one `___`.
- `who`: `I` | `one` | `we` | `many` (optional when the choice is not about the subject).
- `subject`: exact substring of `text`, highlighted at hint step 1.
- Optional `base` for past-tense fill-ins: shown in brackets after the blank, like the workbook: "Yesterday I ___ (go) to the park."
- Optional `clue` (exact substring) and `time` (`now` | `before` | `later`).
- Questions may start with the blank ("___ we go to the park?"); capitalise the option when the blank is first.

### `when` — Now, Before or Later?
```json
{ "id": "p2-when-02", "type": "when", "pic": "🐶",
  "text": "The dog was barking last night.",
  "answer": "before", "clue": "last night" }
```
Options are always the three stations as big coloured buttons with their icons. After a correct answer the station animates and the clue glows.

### `spell` — build the past word from letter tiles
```json
{ "id": "p1-reg-05", "type": "spell", "pic": "👶",
  "base": "cry", "answer": "cried", "pattern": "y-ied" }
```
- Show "cry → ?" with letter tiles: the answer's letters shuffled plus 2 distractor letters.
- Only the correct next letter clicks into place; others wobble. Built-in scaffolding means she can't get stuck.
- `pattern`: `add-ed` | `add-d` | `y-ied` | `double` | `irregular`.

### `build` — tap words in order to make the sentence
```json
{ "id": "p2-build-01", "type": "build", "pic": "📖",
  "text": "I am reading a book." }
```
Words shuffled (punctuation stays attached to the last word). Same "only correct next word clicks in" rule.

### `say` — parent-checked
```json
{ "id": "p2-say-01", "type": "say", "pic": "🎤",
  "prompt": "Tell me something you are doing now.",
  "example": "I am drawing a cat." }
```
Never appears in solo practice. Shown in Grown-ups → Together tasks.

## Hint ladder (solo practice only)

| Wrong tries | What happens |
|---|---|
| 1 | Tapped option wobbles and fades. The `subject` (or `clue`) highlights. A hint line appears with the matching Who icon: "Look: **My two cousins**. One or many? **Many!**" (or the item's own `hint`). For `when`: "Find the time clue: **last night**". For `spell`: the pattern reminder from rules.json. |
| 2 | The unit's rule card appears in compact form (the relevant Who-grid row, or the pattern). |
| 3 | The correct answer is shown and spoken. The item is re-queued at the end of the round. |

Only first-try correct answers count toward stars and objective accuracy.

## Speech

- Web Speech API. Voice preference: `en-GB`, then `en-SG`, then `en-AU`, then any `en-*`. Rate 0.85 (slow 0.7).
- iOS needs a user gesture before the first utterance: the Home screen's first tap unlocks speech.
- If speech isn't available, everything still works silently; hide the speaker icons.
- Read `___` as a short pause: replace with ", ... ,".

## Progress store (`localStorage`)

```json
{
  "version": 1,
  "settings": { "readAloud": true, "rate": 0.85, "name": "" },
  "units":    { "p1-be-now": { "bestStars": 3, "rounds": 4 } },
  "attempts": [ { "item": "p1-be-03", "correct": true, "firstTry": true, "mode": "practise", "t": 1761550000 } ],
  "objectives": {},
  "together": { "p2-say-01": 1761550000 }
}
```
Keep only the last 500 attempts. Objective accuracy is derived from attempts via each unit's `objectives` list. Migrate on version change; never crash on bad data (reset that key instead).

## Round building

- Take the unit's items, shuffle, take 8 (or all if fewer).
- Prefer items the child missed recently (up to 3 of the 8).
- Shuffle `pick` options every time.

## Out of scope for v1

Photo-to-pack in the app, accounts or sync, speech recognition, real illustrations, "going to" future (not in the workbook yet), sound effects beyond speech.

## Acceptance checklist

- [ ] A child can start a practice round from Home in two taps without reading.
- [ ] Every sentence and option is speakable.
- [ ] Wrong answers never show red or the word "wrong".
- [ ] Hint ladder works for `pick`, `when` and `spell`.
- [ ] Adding a new pack file + index entry makes it appear with no code change.
- [ ] `node scripts/validate-packs.mjs` passes.
- [ ] Looks right at 360px, iPad portrait, iPad landscape, desktop; light and dark mode.
- [ ] Works offline after first load is a nice-to-have, not required.
