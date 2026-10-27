# Who & When

A web app that helps a 6-year-old (Primary 1, Singapore) practise English grammar from her class workbook: am/is/are, has/have, simple past, was/were, continuous tenses, and shall/will.

Every answer comes from two questions, and the whole app is built around them:

- **Who is it?** I, one, we, or many.
- **When is it?** Now, Before, or Later.

Full product spec: `docs/SPEC.md`. Read it before building any screen.

## Stack and hosting

- Plain HTML, CSS and JavaScript ES modules. No framework, no build step, no npm runtime dependencies.
- Hosted on GitHub Pages straight from the repo root, custom domain `english.manhtu.dev` (keep a `CNAME` file).
- Content lives in JSON under `content/`. The app fetches it at runtime.
- Progress is stored in `localStorage` only (key prefix `whowhen:`). No server, no accounts.
- Must work on iPhone, iPad (portrait and landscape) and desktop. Test at 360px wide and on iPad Safari.

## Non-negotiable rules

1. **Never require reading to navigate.** Every sentence, option and instruction can be heard by tapping it. Icons and pictures do the work, not labels.
2. **No red crosses, no "Wrong!", no losing points.** A wrong option wobbles and fades. Hints appear in steps (see SPEC, "Hint ladder").
3. **The school's rules win.** I/we → shall, everyone else → will. "Just now" and "a while ago" mean Before. Use Now / Before / Later as the time names (the workbook's words), never "present/past/future" in kid-facing UI.
4. **Content is data.** Never hard-code questions in JS. New workbook packs must be addable by dropping a JSON file in `content/packs/` and listing it in `content/packs/index.json`.
5. **Run `node scripts/validate-packs.mjs` after any change under `content/`.** It must pass with zero errors.
6. Short sessions: 6–8 questions per practice round. Missed questions come back at the end of the same round.

## Design tokens (keep consistent everywhere)

| Meaning | Light bg / text | Dark bg / text | Icon |
|---|---|---|---|
| Now | `#FAEEDA` / `#854F0B` | `#633806` / `#FAC775` | sun |
| Before | `#EEEDFE` / `#534AB7` | `#3C3489` / `#CECBF6` | moon |
| Later | `#E1F5EE` / `#0F6E56` | `#085041` / `#9FE1CB` | sunrise |
| Have | `#FBEAF0` / `#993556` | `#72243E` / `#F4C0D1` | backpack |
| Highlight (hint) | `#FAC775` / `#412402` | `#854F0B` / `#FAEEDA` | — |

- Fonts (Google Fonts): **Andika** for every sentence a child reads (single-storey "a", designed for early readers); **Baloo 2** for headings and buttons. Fallback `system-ui, sans-serif`.
- Sentence text at least 24px on phone, 30px on iPad. Tap targets at least 56px.
- Before cards look slightly faded (a photo of something finished), Now cards look bright, Later cards use a dashed border (not happened yet).
- Mascot: Mimi the cat (emoji 🐱 in v1, replaceable by an image later).
- Light and dark mode via CSS variables on `:root` and `prefers-color-scheme`. Respect `prefers-reduced-motion`.

## Code layout

```
index.html
css/app.css
js/app.js          hash router, boot
js/store.js        localStorage progress (versioned schema)
js/speech.js       Web Speech wrapper (voice choice, iOS unlock)
js/engine.js       round builder, answer checking, hint ladder, re-queue
js/views/*.js      home, pack, learn, practise, checkup, done, grownups
content/rules.json shared rule cards (Learn screens + hint step 2)
content/packs/     index.json + one JSON file per workbook pack
scripts/validate-packs.mjs
docs/SPEC.md
```

Keep modules small and readable; Tu (the parent) maintains this himself.

## Adding a new pack

Use the `add-pack` skill (`.claude/skills/add-pack/`). It turns workbook photos into a pack JSON and validates it.
