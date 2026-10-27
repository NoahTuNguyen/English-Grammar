# Kickoff prompt for Claude Code

Paste the prompt below into Claude Code from the repo root. It builds in phases and stops after each so you can try it on the iPad.

---

Read `CLAUDE.md` and `docs/SPEC.md` fully, then look at `content/rules.json` and both packs in `content/packs/`. The content and validator already exist; your job is the app.

Build v1 in these phases. After each phase: run `node scripts/validate-packs.mjs`, start a local server (`python -m http.server 8080`), tell me what to test on my phone/iPad, and wait for my OK before the next phase.

**Phase 1 — Skeleton and Home**
`index.html`, `css/app.css` with the design tokens (light and dark), Google Fonts Andika + Baloo 2, `js/app.js` hash router, `js/speech.js` (en-GB voice, rate 0.85, iOS unlock on first tap), `js/store.js`. Home screen with the Before · Now · Later timeline strip (tap each to hear its example) and a card per pack loaded from `content/packs/index.json`.

**Phase 2 — Pack and Learn**
Pack screen (units with stars, objectives as circles, check-up button). Learn screen rendering all four rule card types from `rules.json` (`who-grid`, `time-line`, `pattern`, `list`), every cell tap-to-hear, plus the Say it aloud strip.

**Phase 3 — Practise**
`js/engine.js` and the practise view: `pick`, `when`, `spell` (letter tiles), `build` (word tiles). Hint ladder exactly as in the spec, re-queue missed items, first-try scoring, Done screen with stars. No red, no "wrong".

**Phase 4 — Check-up and Grown-ups**
Check-up mode (no hints, no re-queue). Grown-ups screen behind a 2-second press-and-hold: objective accuracy, tricky questions, Together tasks with "She said it" ticks, settings, reset.

**Phase 5 — Polish and deploy**
Check 360px, iPad portrait/landscape, desktop, dark mode, reduced motion. Add `CNAME` (`english.manhtu.dev`), a short `README.md`, and a GitHub Actions workflow that runs the validator on every push. Then walk me through enabling GitHub Pages.

Keep the code simple and well commented; I'll maintain it myself.
