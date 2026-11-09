# portfolio-v2

The personal portfolio of Darshan Sonawane. It's a single static page: HTML, CSS and a little JavaScript, with no framework and no tracking.

- `src/`: the site. Edit **`src/config.js`** to add your LinkedIn, résumé, photo and experience.
- `build.js`: copies `src/` to `docs/` and fills in the site URL (`SITE_URL=https://… node build.js`).
- `docs/`: the built site that Cloudflare Pages serves (no build command; output directory `docs`).
- `test/`: `node --test test/*.test.js` runs the simulation unit tests; `node build.js && node test/e2e.js` runs the browser tests (Playwright + Chrome).

Reports: [PORTFOLIO_AUDIT.md](PORTFOLIO_AUDIT.md) · [PROJECT_VERIFICATION.md](PROJECT_VERIFICATION.md) · [DESIGN_DECISIONS.md](DESIGN_DECISIONS.md) · [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)

Fonts: Inter and JetBrains Mono, both under the SIL Open Font License (see `src/fonts/`).
