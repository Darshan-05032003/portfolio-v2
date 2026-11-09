# Portfolio audit: v1 (darshan-portfolio-6vo.pages.dev)

**What was audited.** The deployed build of v1. `docs/` in the `Portfolio` repo at commit `9f8e9a0` is byte-identical to what Cloudflare Pages serves.

**How.**
- I served it locally and drove it with Playwright (Chrome) at 1440, 1280, 768, 390 and 360 px wide.
- At each width I collected console and page errors, failed requests and horizontal overflow, measured tap targets and took screenshots at five scroll positions.
- I ran axe-core 4.x at 1440 and 390, and Lighthouse (desktop and mobile presets) against the same build.
- I extracted every link and button.
- I inspected the source in `src/`.

**Test environment caveat.** The sandbox has no GPU, so WebGL ran in software (SwiftShader). Frame-time and blocking-time numbers are therefore far worse than on a real device. They are reported as measured, but only to compare the relative cost of the 3D scene, not as real-world performance.

The sandbox also blocks fonts.googleapis.com, so the font request failed here. On the live site the request succeeds, but it is still an external dependency (see #13).

"Fixed in v2" refers to the new site in this repo (`portfolio-v2`). v1 was deliberately left unchanged, as requested.

| # | Problem | Location | Severity | Why it matters | Recommended fix | Status |
|---|---|---|---|---|---|---|
| 1 | Headline statistics that the repositories can't back: "3,100+ tests across repos", "99.3% best line coverage", plus per-repo coverage percentages (99.3%, 98.5%, 97.5% …) in the timing tower | `src/index.html` hero stats, timing-tower rows | High | No coverage report is committed in any repo, and static test counts are lower than the README figures (see PROJECT_VERIFICATION.md). A recruiter who checks finds a mismatch. | Remove unverifiable numbers. State only what code or config proves (e.g. "CI enforces a 95% line-coverage gate in `pom.xml`"). | Fixed in v2 |
| 2 | "0 oversold units / 0 double charges" counters | hero stats | Medium | Presented as production metrics, but they come from tests and simulations. | Drop the counters; explain the guarantee in the project and experiment text. | Fixed in v2 |
| 3 | Fin_Pay row says "built test-first: 1,500+ tests" | timing tower row 07 | Medium | A static count finds about 1,200 test declarations; 1,528 is a runtime count that can't be checked without running the suite. | Describe the test suite qualitatively (unit, widget, golden, CI). | Fixed in v2 |
| 4 | ai-customer-support-agent featured as a finished "agent" | timing tower row 08 | High | The repo is an unfinished take-home (13 of 14 items unchecked), uses no language model, and commits the company's assignment PDF. | Don't feature it. Ask the owner to make the repo private or remove the PDF. | Fixed in v2 (not featured); repo action is for you |
| 5 | Technology claims don't match the owner's real profile: the site presents only Java/Spring + Kotlin, with no Flutter | whole page | Medium | Flutter work (Fin_Pay, BLoC apps) is evidenced but invisible, while the owner's own background lists Flutter. | Add Flutter projects and a skills section with honest proficiency levels. | Fixed in v2 |
| 6 | Horizontal overflow on mobile: page is 429 px wide at a 390 px viewport and 396 px at 360 | `.row`, `.row-btn`, `.skip` link positioned at `left:-857px` | High | Sideways scrolling on phones looks broken. | Contain the rows; hide the skip link with a clip pattern, not a negative offset. | Fixed in v2 |
| 7 | Low colour contrast: 31 nodes at 1440 px, 41 at 390 px (axe `color-contrast`, serious) | section index labels, repo-row subtitles | High (a11y) | Text over a moving 3D scene is hard to read, and fails WCAG AA. | Solid backgrounds behind text; secondary text ≥ 4.5:1. | Fixed in v2 |
| 8 | Text sits directly on the moving 3D scene | timing tower and labs over the car (390 px screenshots) | Medium | Readability depends on whatever frame of the scene is behind the text. | Plain page background; no full-page WebGL. | Fixed in v2 |
| 9 | Heavy page for a portfolio: ~1,056 KiB transferred (three.js ~600 KiB) with continuous GPU rendering | `vendor/three.module.min.js`, `scene.js`, `post.js` | Medium | Lighthouse performance 40 desktop / 35 mobile in this environment. Battery and thermal cost on phones. The 3D car is the identity of v1, not of a recruiter-facing CV site. | Remove the 3D scene from v2 (v1 keeps it). | Fixed in v2 |
| 10 | Nav links are small tap targets (Work 31×21, Labs 28×21, Contact 46×21 px) and there is no mobile menu | header nav | Medium (a11y) | Below the 24×24 px minimum (WCAG 2.2 target size). | Larger hit areas plus a toggle menu on small screens. | Fixed in v2 |
| 11 | No résumé download, no LinkedIn, no About/Education/Skills sections | whole page | High | These are the first things a recruiter looks for. | Add them, driven by `config.js`, with clear TODOs where the owner must supply data. | Fixed in v2 (résumé file and LinkedIn URL are needed from you) |
| 12 | No custom 404 page, no Open Graph image, no `og:url`/`og:type`, no `robots.txt` or `sitemap.xml` | `docs/` | Low | Shared links show no preview image; mistyped URLs show the host's default page. | Add them. | Fixed in v2 |
| 13 | Fonts load from Google Fonts | `<link>` in `index.html` | Low | A third-party request on first paint, a privacy leak, and it needs a CSP exception. | Self-host WOFF2 subsets. | Fixed in v2 |
| 14 | The labs start without saying what problem they show, and read as proof of production experience | Labs section | Medium | The brief asks for problem → concept → try it, and a clear "simulation" label. | Restructure each experiment and label it as a simulation. | Fixed in v2 |
| 15 | Lab inputs are 13×13 px radio buttons; the ledger's Edit buttons are tiny | labs | Low (a11y) | Hard to hit on touch screens. | Larger controls. | Fixed in v2 |
| 16 | Copy is dense and stylised ("Pick the one guarantee that matters…", "Three incidents. Try to cause them.") | headings | Low | Reads as a pitch rather than as a person. | Plainer headings and an About section in the owner's voice. | Fixed in v2 |
| 17 | Location and education absent (removed earlier by request) | — | Info | The new brief explicitly asks for them. | Add Pune, India and Computer Engineering. | Fixed in v2 |

**Verified as fine in v1:**
- No JavaScript page errors at any width.
- No CSP violations from the page.
- All 20 links resolve (internal anchors exist; GitHub repo links return 200 through the proxy).
- Every button does something: race lab, payment lab, ledger lab, copy-email, timing-tower rows.
- `lang="en"`, a title and a meta description are set.
- One `h1`.
- A favicon is present.
- Lighthouse accessibility 96, SEO 100, best practices 96.
- No layout shift (CLS 0).

## Security findings in your repositories (outside the site)

The repo verification found secrets and private material committed to public repos. The website doesn't link to any of these repos, but they are public now:

- `final_road_aI_app/.env`: what look like real Google Maps, weather and OpenRouteService API keys.
- `Currency_Converter`: an API key in a code comment.
- `pvc-panel-CRM/backend/config/db.js`: a hard-coded database password. The auth middleware also logs tokens.
- `FacultyFlow/cookies.txt`: a committed login token.
- `ai-customer-support-agent`: the hiring company's assignment PDF is committed.

**Recommended:** rotate or revoke those keys, then remove them from git history (or make those repos private).
