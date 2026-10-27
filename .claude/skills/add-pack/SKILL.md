---
name: add-pack
description: Turn photos or scans of Jennie's English workbook pages into a new Who & When content pack (JSON) and validate it. Use this whenever the user shares workbook pages, mentions a new pack, unit, chapter or homework from school, or asks to add, extend or fix questions in content/packs/, even if they don't say "pack".
---

# Add a workbook pack

Goal: a new `content/packs/<id>-<slug>.json` that mirrors the workbook booklet, plus an entry in `content/packs/index.json`, passing `node scripts/validate-packs.mjs`.

Read `docs/SPEC.md` ("Item types") and `content/rules.json` first so the output matches the schema and reuses existing rule cards.

## 1. Read the pages

For each photo, note:
- The cover's "In this pack I will learn to" list → `objectives` (rewrite in short, child-friendly words).
- Each topic page title ("Meet the verb…", "Choose…", "When is it happening?") → one `unit`.
- The rule table on "Meet the…" pages → which rule card the unit uses. Reuse an existing key in `rules.json` if it fits; otherwise add a new card in the same format (`who-grid`, `time-line`, `pattern` or `list`).
- Question formats → item types: circle/choose → `pick`; "(go)" fill-ins → `pick` with `base`; "go →" → `spell`; N/B/L → `when`; "Say it aloud" and "Write one sentence" → `together` (`say`).
- "Mini Check-Up" page → `checkup` (each item with `unit`).
- Any special school rule on the page (like "I / we → shall"). Ask the user if a rule is unclear; never guess. The school's rule wins over general grammar.

## 2. Write the items

- **Write original sentences in the same style** (change names, objects and places; keep the grammar point and the trap). The app is public on GitHub Pages, so don't copy the workbook's sentences word for word unless the user says this pack is private.
- Keep the traps the workbook uses: plural subjects with "My two…", "The children", names joined with "and", one-thing subjects with many objects ("The tree ___ many leaves"), "you" always plural-style.
- Every `pick` that depends on the subject gets `who` and `subject` (exact substring). Every item with a time word gets `clue` and `time`.
- Add a custom `hint` only when the automatic one ("Look: X. One or many?") wouldn't help, e.g. irregular plurals or be-versus-have.
- 6–12 items per unit, sentences under 70 characters, everyday Singapore-kid contexts (MRT, hawker centre, recess, durians are fine).
- A `pic` emoji on every item, matching the sentence.
- Item ids: `<pack>-<unit short>-<nn>`, unique across all packs.

## 3. Register and validate

1. Add `{ "id": "...", "file": "..." }` to `content/packs/index.json` in workbook order.
2. Run `node scripts/validate-packs.mjs`. Fix every ERROR. Read the warnings and fix those that point to real problems (missing who/subject, clue not in rules.json when it's a genuine school clue).
3. Show the user a short summary: units, item counts, any new rule cards, and anything in the photos you were unsure about.

## Don't

- Don't change app code to support a pack. If a page needs a new question type, stop and describe it to the user instead.
- Don't add "going to" or other forms the school hasn't taught yet.
