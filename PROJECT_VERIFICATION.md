# Project verification

**Scope.** On 2026-11-09 I checked every public repo under `github.com/Darshan-05032003` by cloning it and reading its source and build files. I didn't rely only on the READMEs. Private repos were not inspected and are not linked from the site, because visitors would get a 404.

**How tests were counted.** No Gradle, Maven or Flutter builds were run here (there is no Android or Flutter SDK in this environment, and Maven/Gradle runs were out of scope). Test counts are static counts of test annotations and calls in the source. They show the size of the suite, not pass/fail results.

**What the site does with numbers.** Where a README number can't be proven from the repo, the website omits it. Examples are coverage percentages with no committed report and benchmark timings with no committed output.

---

## Featured on the site

### PayFlow: Android (Kotlin, Jetpack Compose)
- **URL:** https://github.com/Darshan-05032003/PayFlow
- **What it does:** A UPI payments client. It hands `upi://pay` intents to installed UPI apps, or settles against an in-app sandbox payment provider. A local payment ledger can't settle the same payment twice.
- **What the code actually implements:**
  - **Payment states:** a payment state machine (`domain/model/PaymentStateMachine.kt`). Room compare-and-set updates (`UPDATE … WHERE id = :id AND status = :expectedStatus`, in `data/local/PaymentDao.kt`) mean two racing updates can't both win.
  - **Idempotency:** a key with a unique index, persisted before the provider call (`data/local/PaymentEntity.kt`).
  - **QR:** CameraX + ML Kit QR scanning, with a zxing fallback, and receive-QR generation.
  - **Other flows:** collect requests, AutoPay mandates, backoff polling.
  - **Security:** Keystore AES-GCM storage; PIN hashed with PBKDF2-HMAC-SHA256 at 150,000 iterations; `FLAG_SECURE` on sensitive screens.
  - **SDK use:** consumes the author's own CheckoutKit SDK from JitPack.
- **Stack:** Kotlin, Compose, Material 3, Navigation, Hilt, Room (4 exported schemas), DataStore, OkHttp, CameraX, ML Kit, Biometric.
- **Architecture:** MVVM + clean layers (`ui/`, `domain/`, `data/`, `di/`). External SDKs sit behind interfaces with fakes. Money is stored as `Long` paise.
- **Tests:** ~631 `@Test` in unit/Robolectric tests, plus 56 Roborazzi screenshot tests, a stress test package and a Kover ≥80% rule.
- **Not verifiable / caveats:**
  - The README's 89% coverage figure isn't verifiable: no report is committed.
  - The README's test count is out of date. It says 428, but the code has more.
  - There's no CI, and no real provider or bank: payments are sandboxed.
- **Screenshots:** 12 real emulator captures in `docs/screenshots/`. The site uses 4 of them.
- **Live demo:** none.

### SplitSmart: Android (Kotlin, Compose, ML Kit, Gemini)
- **URL:** https://github.com/Darshan-05032003/SplitSmart
- **What it does:** Photograph a receipt. On-device OCR plus a Gemini call extracts the line items, with a regex parser as fallback. The bill is split exactly to the paisa, and the app produces UPI settle-up links and QR codes.
- **What the code actually implements:**
  - **Bill splitting:** largest-remainder apportionment (`domain/split/LargestRemainder.kt`) and debt simplification.
  - **Handling LLM output:** treated as untrusted. It goes through JSON repair, then parsing, then validation (`domain/parser/`).
  - **Network security:** certificate pinning for the Gemini host (`data/llm/LlmHttpClient.kt`).
  - **Build:** Firebase is wired conditionally, so a clean clone still builds.
- **Stack:** Kotlin, Compose, Hilt, Room (3 schemas, AutoMigrations), DataStore, OkHttp, CameraX, ML Kit Text Recognition, zxing; Firebase Analytics/Crashlytics are optional.
- **Tests:** 302 `@Test`. This matches the README's breakdown exactly.
- **Not verifiable / caveats:**
  - The 95.2% coverage figure and the latency numbers aren't committed, so they can't be checked.
  - The API key ships inside the APK; the README acknowledges this.
  - There's no CI.
- **Screenshots:** 19 real emulator captures in `docs/screenshots/`. The site uses 4.
- **Live demo:** none.

### CheckoutKit: Kotlin Multiplatform SDK
- **URL:** https://github.com/Darshan-05032003/CheckoutKit
- **What it does:** A drop-in payment SDK. A Compose payment sheet sits on top of a pure payment state machine, with retries, idempotency, typed errors and a pluggable gateway.
- **What the code actually implements:**
  - **Core logic:** the state machine with an atomic compare-and-set holder; a retry executor and retry policy; an in-memory idempotency store; Luhn, expiry and VPA validators.
  - **Unknown outcomes:** reported as "Unresolved", not "Failed".
  - **Public API:** locked by Kotlin explicit-API mode plus committed binary-compatibility `.api` dumps.
- **Stack:** Kotlin Multiplatform (common/JVM/Android), coroutines, Compose, ViewModel/SavedStateHandle, maven-publish, JitPack.
- **Tests:** 275 `@Test`. This matches the README.
- **Not verifiable / caveats:**
  - JitPack itself couldn't be reached from the sandbox. The release is still supported by the evidence: the `v1.0.0` tag exists, `jitpack.yml` is present, and PayFlow resolves the artifact.
  - The coverage figures aren't committed.
  - There's no CI.
  - The README's screenshot table is a placeholder.
- **Screenshots:** none (library). The site uses a text and code presentation instead.

### Fin_Pay: Flutter
- **URL:** https://github.com/Darshan-05032003/Fin_Pay
- **What it does:** An offline fintech demo app: onboarding and login, home balance, a card stack, P2P transfer with swipe-to-pay, statistics, transactions and notifications.
- **What the code actually implements:**
  - **State and architecture:** BLoC/Cubit state, go_router, GetIt dependency injection, and a clean-architecture split (screens → blocs → use cases → repositories → sqflite/secure storage).
  - **Data:** a sqflite ledger with migrations, money in paise, and a unique idempotency index on transactions.
  - **Security:** PBKDF2 password hashing; `FLAG_SECURE` set through a platform channel.
  - **UI:** a design-token system with 20 shared components.
- **Tests:**
  - About 1,200 test declarations (unit, widget, golden, stress) and 144 committed golden images.
  - **GitHub Actions CI**: format check, analyze and test.
  - The README's "1,528 tests" is a runtime count and isn't checked here.
- **Caveats:** fully offline. The payment gateway, OTP and biometrics are simulated by design. Coverage isn't committed.
- **Screenshots:** 9–10 real device GIF recordings (moto g64) in `docs/images/`. The site uses still first frames from 4 of them.
- **Live demo:** none.

### core-banking-ledger: Java 21, Spring Boot
- **URL:** https://github.com/Darshan-05032003/core-banking-ledger
- **What it does:** A double-entry core-banking ledger: customers and accounts, teller deposits and withdrawals, idempotent transfers with maker-checker approval and holds, statements, interest accrual, an end-of-day check, and Kafka events through a transactional outbox.
- **What the code actually implements:**
  - **Append-only ledger:** Postgres triggers reject UPDATE, DELETE and TRUNCATE on the ledger (`V4__make_ledger_append_only.sql`).
  - **Locking:** `SELECT … FOR UPDATE` on balance rows with `SET LOCAL lock_timeout`.
  - **Outbox:**
    - Writes require an existing transaction (`Propagation.MANDATORY`).
    - The relay claims rows with `FOR UPDATE SKIP LOCKED`.
    - The consumer de-duplicates with `ON CONFLICT DO NOTHING`.
  - **Scheduling:** ShedLock on scheduled jobs.
  - **Boundaries:** 9 ArchUnit rules.
  - **Statements:** keyset pagination plus a window-function running balance.
  - **Auth:** RS256 JWTs and four-eyes approval.
- **Stack:** Spring Boot 4.1, Security / OAuth2 Resource Server, Data JPA + JDBC, PostgreSQL 16, Flyway (V1–V15), Kafka, ShedLock, Bucket4j, Testcontainers (Postgres, Kafka), Docker Compose, GitHub Actions.
- **Tests:** 419 annotated tests (379 `@Test`, 31 parameterized, 9 ArchUnit). A 100,000-journal volume test exists in code.
- **Not verifiable:**
  - The "711 tests" count (parameterized expansion wasn't executed).
  - The coverage percentages: no report is committed. The **95% JaCoCo gate in `pom.xml` is real**.
  - Query timings.
- **Diagrams:** Mermaid architecture and sequence diagrams in the README. The site shows a simplified, hand-drawn version of the same flow.
- **Live demo:** none.

### ecommerce-backend: Java 21, Spring Boot
- **URL:** https://github.com/Darshan-05032003/ecommerce-backend
- **What it does:** A REST backend for an online shop: catalogue, cart, idempotent order placement, simulated card/UPI/COD payments with refunds, and an admin order state machine.
- **What the code actually implements:**
  - **Stock:** a conditional stock decrement (`… WHERE stockQuantity >= :quantity`, `product/ProductRepository.java`).
  - **Locking:** `@Version` optimistic locking on Product and Order.
  - **Orders:** idempotency keys.
  - **Payments:** a `REQUIRES_NEW` attempt log, so declined payments are still recorded.
  - **Notifications:** emails sent after commit.
  - **Auth:** refresh tokens stored hashed, with reuse detection that revokes the whole token family; Bucket4j login rate limiting.
  - **Concurrency test:** 20 concurrent buyers.
- **Stack:** Spring Boot 4.1, Security, Data JPA, MySQL, Redis cache, Flyway, JWT (jjwt), MapStruct, Testcontainers (MySQL, Redis), Docker Compose, GitHub Actions.
- **Tests:** 351 annotated test methods. The **95% JaCoCo line gate in `pom.xml` is real**.
- **Not verifiable:** "600 tests" and "99.3% coverage" have no committed report. There's also no load-test script.
- **Live demo:** none.

### Also built (shown in a compact list)

- **transaction-reconciliation-batch** (Spring Batch):
  - Partitioned, restartable matching with a `FULL OUTER JOIN` candidate query and SHA-256 duplicate-file detection.
  - 213 annotated tests, plus CI with ShellCheck.
  - The benchmark numbers have no committed output, so the site doesn't show them.
- **Learning_dashboard_app** (Flutter):
  - Feature-first clean architecture with BLoC and GetIt; 49 test cases (matches the README).
  - Offline mode is a mock flag, so the site doesn't claim real connectivity handling.
- **Investor_Deal_App** (Flutter): clean architecture with BLoC and 28 `blocTest` cases. Its README overstates several things (wrong demo login, "Hero animations", "O(log n)" filtering); the site describes only what exists.

## Not featured, and why

| Repo | Reason |
|---|---|
| final_road_aI_app (Smart Road family) | The largest Flutter codebase, with real Firebase multi-role flows. But the "AI" features are faked, about 42% of its lines are commented-out code, there are no tests, and a committed `.env` exposes API keys. **Rotate the keys first**; it could be featured later as "Firebase multi-role app" with honest wording. |
| woozie_speed_repo | Clean GetX + Retrofit architecture, but it looks like client or internship work for a real company (calls `dev.wooziee.com`). **TODO for you:** confirm your role and that you may show it. |
| pvc-panel-CRM | Node/Express + React. Lead data is hard-coded mocks, there are no tests, and it contains a hard-coded DB password. |
| FacultyFlow | React/TypeScript + Node/Express/Prisma, but no tests and a committed `cookies.txt` login token. |
| ai-customer-support-agent | An unfinished take-home with no language model, and it includes the company's assignment PDF. |
| teamTracker, Companion_GateKeeper, Employee-compensation-service, f1_visionTrack, Currency_Converter, Password_Generator, Quiz_App, todoAPp, bus_Vendor_App | Small, unfinished, or failing tests. |
| GeoGuard | Excluded at your request (company assignment). |
| 10 empty repos | No commits: Flutter-Expense-Tracker-App, smart_road_assist, smart_road_app_v1, bus_AdminApp, Amul-Product-Notification-System, SmartShop-E-commerce-Platform, SmartShop-E-Commerce-Web-Application, Chat_app_React, Real-Time-Stock-Price-Prediction-using-LSTM, AI-Based-Crop-Recommendation-System. Consider deleting them or making them private; empty repos weaken the profile. |

## Technology claims vs evidence

| Technology | Evidence in public code | Shown on site as |
|---|---|---|
| Kotlin, Android SDK, Jetpack Compose, Room, Hilt, Coroutines/Flow | PayFlow, SplitSmart, CheckoutKit | Used in projects |
| Kotlin Multiplatform | CheckoutKit | Used in projects |
| Firebase | SplitSmart (Analytics/Crashlytics, optional), final_road_aI_app (Auth/Firestore/Messaging) | Used in projects |
| Flutter, Dart, BLoC, GetIt, go_router, sqflite | Fin_Pay, Learning_dashboard_app, Investor_Deal_App | Used in projects |
| GetX | woozie_speed_repo only (authorship unconfirmed) | Working knowledge |
| Riverpod | A broken skeleton in bus_Vendor_App only | Learning |
| Provider | Not in any pubspec | Learning |
| Java, Spring Boot, Spring Batch, Spring Security, JPA | Three backend repos | Used in projects |
| PostgreSQL, MySQL, Flyway, Redis, Kafka | Backend repos | Used in projects |
| Docker, Docker Compose, Testcontainers, GitHub Actions | Backend repos, Fin_Pay CI | Used in projects |
| JavaScript, Node.js, Express, React | pvc-panel-CRM, FacultyFlow, teamTracker (small, untested) | Working knowledge |
| TypeScript | FacultyFlow (~8.8k lines TS/TSX, no tests) | Working knowledge |
| MongoDB | teamTracker (pymongo, never run against a live DB) | Learning |
| Postman, Android Studio, VS Code | Not verifiable from code (tools) | Listed under tools, no level |
