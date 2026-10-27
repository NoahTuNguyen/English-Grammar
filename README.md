# Who & When

English grammar practice for a Primary 1 child, following her school workbook: am/is/are, has/have, simple past, was/were, continuous tenses, and shall/will. Every answer comes from two questions: **Who is it?** and **When is it?**

Live at **https://english.manhtu.dev**

- Plain HTML, CSS and JavaScript modules. No build step, no dependencies.
- Questions live in JSON under `content/`. Progress is saved in the browser (`localStorage`) only.
- Grown-ups page: press and hold the small button in the top corner of Home for 2 seconds.

The full product spec is in [docs/SPEC.md](docs/SPEC.md). Rules for working on the code are in [CLAUDE.md](CLAUDE.md).

## Run it locally

```sh
python -m http.server 8080
```

Then open http://localhost:8080. To try it on an iPad, use this computer's local IP address instead of `localhost` (same Wi-Fi). It has to be served over http; opening `index.html` as a file won't load the content.

## Add a workbook pack

1. Add `content/packs/<name>.json` (copy an existing pack for the shape; the item types are described in the spec).
2. List it in `content/packs/index.json`.
3. Run the validator:

   ```sh
   node scripts/validate-packs.mjs
   ```

   It must report 0 errors. It also checks the school's rules (I/we → shall, everyone else → will, and so on).

The `add-pack` Claude Code skill can turn photos of workbook pages into a pack.

## Code map

| File | What it does |
|---|---|
| `index.html`, `css/app.css` | Page shell; all colours are design tokens on `:root` (light and dark) |
| `js/app.js` | Starts the app; the hash router (`#/pack/p1`, `#/learn/p1/<unit>`, …) |
| `js/content.js` | Loads `rules.json` and the packs |
| `js/store.js` | Saved progress (versioned; bad data is reset, never crashes) |
| `js/speech.js` | Read-aloud: voice choice, speed, the iOS unlock |
| `js/engine.js` | Rounds, scoring, stars, hint text |
| `js/rulecard.js` | Draws the rule cards (Learn screen and hint step 2) |
| `js/ui.js`, `js/icons.js` | Small shared helpers and icons |
| `js/views/*.js` | One file per screen |

## Deploy

GitHub Pages serves the `main` branch from the repository root. The `CNAME` file holds the custom domain. Every push runs the validator in GitHub Actions (`.github/workflows/validate.yml`).
