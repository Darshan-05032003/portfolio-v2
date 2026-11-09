# Implementation summary

**Live:** https://darshan-05032003.github.io/portfolio-v2/ (GitHub Pages, branch `main`, folder `/docs`).

The original site (https://darshan-portfolio-6vo.pages.dev) and the `Portfolio` repo were not changed.

## What was done, in order

1. **Inspected v1.** All source files (`src/*.js`, `index.html`, `style.css`), the build script, deploy config and tests.
2. **Audited v1** (PORTFOLIO_AUDIT.md):
   - Playwright at 1440, 1280, 768, 390 and 360 px.
   - axe-core, Lighthouse, a link and button inventory, and console/network logs.
   - 17 findings, each with a severity and a fix.
3. **Verified the projects** (PROJECT_VERIFICATION.md):
   - Every public repo was cloned and its source and build files read.
   - Test counts were taken from the source.
   - README claims were checked against the code, and technology claims against dependency files.
4. **Rebuilt the site** in `src/`, keeping v1's architecture (static HTML/CSS/JS, no framework):
   - **Hero:** name, a one-line focus, a short paragraph, *View projects* / *Download résumé* / *Contact me*, GitHub, LinkedIn and Email links, and a "two minutes" reading order.
   - **Projects:**
     - Six featured (PayFlow, SplitSmart, Fin_Pay, CheckoutKit, core-banking-ledger, ecommerce-backend), filterable by Android/Kotlin, Flutter and Backend.
     - Each one shows: real screenshots or a real diagram, problem, what I built, stack, and expandable architecture / interesting details / challenges / testing / limits, with a GitHub link.
     - Three more repos in a compact list.
   - **Engineering experiments:** v1's three simulations, each with "the problem" and "the fix" explained first, labelled as simulations, and working on phones.
   - **About:** a personal introduction, education, availability, and an experience list that stays hidden until you add real roles.
   - **Skills:** five groups with three honest tiers (used in projects, working knowledge, learning). No percentages.
   - **Contact:** email link, copy-to-clipboard, and résumé.
   - **Footer, 404 page, SEO meta, Open Graph image, favicon, `robots.txt`, `sitemap.xml`.**
5. **Removed:**
   - The 3D scene and its ~600 KiB of three.js.
   - Google Fonts (now self-hosted).
   - All unverifiable statistics.
6. **Security hardening:**
   - A strict Content-Security-Policy (meta tag for GitHub Pages, plus a `_headers` file in case it's ever served from Cloudflare Pages), with no inline scripts or styles.
   - Config URLs are allow-listed (`https:`, `mailto:` or relative). `javascript:` links are rejected.
   - Experience entries are inserted as text, never as HTML.
   - External links use `rel="noopener noreferrer"`.

## Tests actually run (2026-11-09, in this sandbox)

| Check | Result |
|---|---|
| `node --test test/*.test.js` (simulation logic) | 36 pass, 0 fail |
| `node build.js && node test/e2e.js` (Playwright + Chrome) | 19 checks pass, as listed below |
| 5 widths: no horizontal overflow, every image loads, standalone controls ≥ 24 px | pass |
| SEO: title, description, one `h1`, canonical, Open Graph, favicon, robots, sitemap, 404 | pass |
| Links: every `#anchor` exists; every linked repo is public (`git ls-remote`); `rel=noopener` on new-tab links | pass |
| GitHub profile URL | checked by hand (the sandbox proxy blocks the profile page itself) |
| Config: unset résumé/LinkedIn/experience hidden; set values shown; HTML escaped; `javascript:` rejected | pass |
| Mobile menu: open, navigate, close on link and on Escape; the section isn't hidden under the sticky header | pass |
| Project filter counts and the live announcement; details open by mouse and keyboard | pass |
| Copy email to clipboard | pass |
| Experiment 1: read-then-write oversells (15 orders for 5 units); conditional UPDATE sells exactly 5 | pass |
| Experiment 2: 3 charges without an idempotency key, 1 with | pass |
| Experiment 3: edit refused, four-eyes enforced, unbalanced journal refused, books balanced | pass |
| Experiments on a 390 px phone | pass |
| Keyboard: skip link first, focus moves into main | pass |
| 404 page served for unknown paths, link home works | pass |
| axe-core (WCAG 2.2 AA + best practices) at 1440 and 390 px | 0 violations |
| Console errors / page errors / failed requests with CSP enforced | none |
| Lighthouse, desktop and mobile | Performance 100 · Accessibility 100 · Best practices 100 · SEO 100 |

**Page weight:** about 300–355 KiB transferred. Most of it is the 12 WebP screenshots, which load lazily, and two WOFF2 fonts. v1 was about 1,056 KiB.

**What was not tested:**
- A real résumé download: there's no file yet. The button logic is tested with a fake path.
- Lighthouse on the live URL: the sandbox can't reach github.io directly, so it was run against the identical local build.
- Real phones: emulated viewports only.

## Security and load notes

- **Nothing to attack server-side:** the site is fully static, with no server code, forms, cookies or third-party scripts. Visitor input exists only inside the simulations, which run in the browser and touch no network.
- **Traffic:** GitHub Pages serves it from a CDN, so thousands of visitors at once is a non-issue.
- **Things to watch:**
  - Keep `config.js` values to real `https:` URLs.
  - If you ever add a contact form, it needs a backend with rate limiting and spam protection. Today it's a `mailto:` link.

## What still needs your input (TODOs)

All of these are in **`src/config.js`**. After editing, run `node build.js` and push.

1. **`linkedin`:** your LinkedIn URL. The LinkedIn links stay hidden until it's set.
2. **`resume`:** add `src/resume/Darshan-Sonawane-Resume.pdf`, then set the path. Both "Download résumé" buttons stay hidden until then.
3. **`photo`:** add a square photo (`src/img/photo.webp`). The About section shows your initials until then.
4. **`experience`:** real roles only (job, internship, freelance), if you want an Experience section.
5. **Education:** the About section shows *B.E. Computer Engineering, Dr. D. Y. Patil Institute of Technology, Pune, 2022–2026*. Correct it in `src/index.html` if anything is off.
6. **woozie_speed_repo:** confirm whether you can show this client or internship work. It isn't featured until you do.
7. **Repo hygiene** (see PORTFOLIO_AUDIT.md, "Security findings"):
   - Rotate the API keys committed in `final_road_aI_app/.env` and in `Currency_Converter`.
   - Remove the DB password from `pvc-panel-CRM`, `cookies.txt` from `FacultyFlow`, and the assignment PDF from `ai-customer-support-agent`.
   - Delete or privatise the 10 empty repos.
8. **README fixes in your project repos:**
   - Update PayFlow's test counts.
   - Correct Investor_Deal_App's demo login and its "Hero animations" and "O(log n)" claims.
   - Commit coverage reports (or drop the percentages) for the repos whose READMEs quote coverage.
