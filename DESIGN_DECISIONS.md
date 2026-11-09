# Design decisions

## What I kept from v1

- **The engineering angle.** v1's best idea was showing *why* the code is built the way it is: race conditions, idempotency, an append-only ledger. v2 keeps that. Each project explains the problem, what was built, interesting details with file paths, and its honest limits.
- **The three simulations.** v1 called them "labs"; v2 calls them "Engineering experiments". `sim.js`, `motion.js` and `labs.js` are reused unchanged apart from a few status strings, and so are their unit tests. They now sit *after* the projects, open with a plain-language explanation of the problem and the fix, and say clearly that they are simulations.
- **The palette.** Graphite with one orange accent. The F1 reference survives only as a small orange underline in the "DS" mark.

## What I changed, and why

| Decision | Why |
|---|---|
| Removed the full-page 3D car scene (three.js, post-processing, ~600 KiB) | On a recruiter-facing site it made text hard to read and cost GPU and battery. Lighthouse performance went from 40/35 (v1, software GL) to 100/100. v1 still exists with the car. |
| Plain static HTML/CSS/JS, no framework, no build step beyond copying | Same architecture as v1. A one-page site doesn't need a framework, and it stays easy to maintain by hand. |
| Inter for text, JetBrains Mono only for code, file paths and simulation readouts | The brief asks for monospace only where it's technically meaningful. Both fonts are self-hosted (SIL OFL licences in `src/fonts/`), so there are no third-party requests and the CSP can be strict. |
| Real screenshots only | PayFlow and SplitSmart use their committed emulator captures; Fin_Pay uses still frames from its committed device recordings. CheckoutKit is a library, so it shows its real transition table instead. The backend repos show a simplified version of the Mermaid diagrams in their own READMEs. Nothing is mocked up. |
| No counters or percentages | Coverage figures and runtime test counts can't be proven from the repos. The site states what code and config prove (e.g. "a JaCoCo rule fails the build below 95%"), plus static test counts where the README matches the source. |
| Each project has a "Limits" paragraph | It says what's simulated (no real payment provider, offline only, no CI). That makes the rest believable, and it's what a technical interviewer will ask about anyway. |
| Skills in three honest tiers: used in projects / working knowledge / learning | No progress bars. Each skill's tier is backed by PROJECT_VERIFICATION.md. TypeScript, Node, Express and React are "working knowledge" because they only appear in small, untested repos. Riverpod, Provider and MongoDB are "learning". |
| "If you only have two minutes" panel in the hero | Recruiters skim. It gives three projects and one experiment as a reading order and fills the empty right side of the hero with something useful. |
| Personal details come from `src/config.js` | LinkedIn, résumé, photo and experience aren't known yet. Empty values hide the matching UI, so visitors never see a placeholder link. The TODOs live in one file for you. |
| One page plus expandable details (`<details>`) | Keyboard-accessible with no JavaScript, and the project list stays scannable. Separate project pages would split thin content across many URLs. |
| Location and education added | The brief asks for them. v1 had removed them at your earlier request. |

## Design tokens (in `src/style.css :root`)

- **Background:**
  - `--bg` #121316 for the page, and `--bg-2` #16171b for alternate sections.
  - `--surface` and `--surface-2` for cards and inputs.
- **Lines:** `--line` #2a2c33 and `--line-2` #383a43, 1 px hairlines.
- **Text:**
  - `--text` #ececef.
  - `--muted` #a3a6b0, 7.6:1 on the background.
  - `--faint` #8b8e99, 5.6:1, still above the AA minimum.
- **Accent:** `--accent` #ff6b35. Used for primary buttons, focus rings, the small rules in the eyebrow and logo mark, and the Problem / What I built labels.
- **States (simulations only):** `--good`, `--warn`, `--bad`.
- **Spacing:** a 4 px base (`--s1` … `--s9`). Radii are 6 and 10 px. One easing curve and one duration (180 ms).
- **Type scale:**
  - Hero heading: 38–64 px.
  - Section headings: 28–38 px.
  - Project titles: 26 px.
  - Body: 17 px (16 px on phones).
  - Labels: 13–15 px.
- **Motion:** only hover/focus transitions, the `<details>` chevron, and the simulations themselves. Everything respects `prefers-reduced-motion`.

## Accessibility decisions

- **Navigation:** a skip link, sticky header and a mobile menu.
  - The menu toggle has `aria-expanded`. Escape and clicking outside close it.
  - The nav marks the current section with `aria-current`.
- **Touch targets:** at least 44 px for standalone controls; inline links are exempt.
- **Filters:** they use `aria-pressed`, and the number of projects shown is announced in a polite live region.
- **Scrolling regions:** the sideways-scrolling screenshot strips are focusable regions, so keyboard users can scroll them.
- **Contrast:** checked with axe-core at 1440 and 390 px — zero violations.
