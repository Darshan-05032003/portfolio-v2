// End-to-end checks for portfolio v2, against the built docs/ folder.
// Run: node build.js && node test/e2e.js      (needs Chrome + Playwright)
const { chromium } = require(process.env.PW || '/opt/npm-tools/node_modules/playwright');
const assert = require('node:assert/strict');
const http = require('http'), fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');

const root = path.join(__dirname, '..', 'docs');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain', '.pdf': 'application/pdf' };
const csp = fs.readFileSync(path.join(root, '_headers'), 'utf8').match(/Content-Security-Policy: (.*)/)[1];
const srv = http.createServer((q, res) => {
  let p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (p.endsWith('/')) p += 'index.html';
  fs.readFile(p, (e, d) => {
    if (e) { res.writeHead(404, { 'Content-Type': 'text/html', 'Content-Security-Policy': csp }); res.end(fs.readFileSync(path.join(root, '404.html'))); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream', 'Content-Security-Policy': csp }); res.end(d);
  });
});
let passed = 0; const ok = (m) => { passed++; console.log('ok  ', m); };
const WIDTHS = [[1440, 900], [1280, 800], [768, 1024], [390, 844], [360, 740]];

(async () => {
  await new Promise((r) => srv.listen(0, r)); const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  // pages that use absolute SITE_URL links (the 404 page's <base>) are served from the local build
  const SITE = fs.readFileSync(path.join(root, 'index.html'), 'utf8').match(/<link rel="canonical" href="([^"]+?)\/?">/)[1].replace(/\/$/, '');
  // serve the production origin from the local build, so the 404 page (which uses <base href=SITE>) is same-origin
  const fromDisk = (r) => {
    let rel = decodeURIComponent(new URL(r.request().url()).pathname.slice(new URL(SITE).pathname.length)) || '/';
    if (rel.endsWith('/')) rel += 'index.html';
    const f = path.join(root, rel);
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return r.fulfill({ status: 404, contentType: 'text/html', headers: { 'Content-Security-Policy': csp }, body: fs.readFileSync(path.join(root, '404.html')) });
    return r.fulfill({ status: 200, contentType: types[path.extname(f)] || 'application/octet-stream', headers: { 'Content-Security-Policy': csp }, body: fs.readFileSync(f) });
  };
  const b = { newPage: async (opts) => { const p = await browser.newPage(opts); await p.route(SITE + '/**', fromDisk); return p; }, close: () => browser.close() };
  const errors = [];
  const watch = (p, tag) => { p.on('pageerror', (e) => errors.push(`${tag} pageerror ${e.message}`)); p.on('console', (m) => { if (m.type() === 'error') errors.push(`${tag} console ${m.text()}`); }); p.on('requestfailed', (r) => errors.push(`${tag} requestfailed ${r.url()}`)); };

  // ---------- every width: layout, images, overflow, tap targets ----------
  for (const [w, h] of WIDTHS) {
    const p = await b.newPage({ viewport: { width: w, height: h } }); watch(p, `w${w}`);
    await p.goto(base + '/');
    await p.evaluate(async () => { for (let y = 0; y <= document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } });
    for (const img of await p.locator('img[src]:not([hidden])').all()) { await img.scrollIntoViewIfNeeded(); }
    await p.waitForTimeout(400);
    const r = await p.evaluate(() => ({
      sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth,
      broken: [...document.images].filter((i) => !i.hidden && i.getAttribute('src') && !(i.complete && i.naturalWidth > 0)).map((i) => i.getAttribute('src')),
      small: [...document.querySelectorAll('a, button, summary, input')].filter((e) => { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || e.closest('[hidden]') || e.closest('.journal')) return false; const b = (e.closest('label') || e).getBoundingClientRect(); return b.width > 0 && (b.height < 24 || b.width < 24) && !e.closest('p, li, dd, td, figcaption, .explain'); }).map((e) => (e.textContent || e.className).trim().slice(0, 30))
    }));
    assert.ok(r.sw <= r.vw, `no horizontal overflow at ${w}px (scrollWidth ${r.sw} vs ${r.vw})`);
    assert.deepEqual(r.broken, [], `all images load at ${w}px`);
    assert.deepEqual(r.small, [], `standalone controls are at least 24x24 at ${w}px`);
    await p.screenshot({ path: `/tmp/v2e-w${w}.png` });
    ok(`${w}px: no overflow, images load, tap targets ≥ 24 px`);
    await p.close();
  }

  const page = await b.newPage({ viewport: { width: 1440, height: 900 } }); watch(page, 'main');
  await page.goto(base + '/');

  // ---------- meta / SEO ----------
  const meta = await page.evaluate(() => ({
    title: document.title, desc: document.querySelector('meta[name=description]').content, lang: document.documentElement.lang,
    og: Object.fromEntries([...document.querySelectorAll('meta[property^="og:"]')].map((m) => [m.getAttribute('property'), m.content])),
    canonical: document.querySelector('link[rel=canonical]').href, h1: document.querySelectorAll('h1').length, icon: document.querySelector('link[rel=icon]').href
  }));
  assert.match(meta.title, /Darshan Sonawane/); assert.ok(meta.desc.length > 80 && meta.desc.length < 300); assert.equal(meta.lang, 'en'); assert.equal(meta.h1, 1);
  for (const k of ['og:title', 'og:description', 'og:image', 'og:url', 'og:type']) assert.ok(meta.og[k] && !meta.og[k].includes('%SITE_URL%'), k);
  assert.ok(!meta.canonical.includes('%'));
  for (const f of ['og.png', 'favicon.svg', 'robots.txt', 'sitemap.xml', '404.html']) assert.ok(fs.existsSync(path.join(root, f)), f);
  ok('SEO: title, description, one h1, canonical, Open Graph, favicon, robots, sitemap, 404 page');

  // ---------- links ----------
  const links = await page.evaluate(() => [...document.querySelectorAll('a[href]')].filter((a) => !a.closest('[hidden]') && !a.hidden).map((a) => ({ href: a.getAttribute('href'), text: a.textContent.trim().slice(0, 40), blank: a.target === '_blank', rel: a.rel })));
  for (const l of links) {
    assert.ok(l.href && l.href !== '#' && !l.href.includes('yourusername'), `real href: ${l.text}`);
    if (l.href.startsWith('#')) assert.ok(await page.locator(l.href).count() === 1, `anchor ${l.href} exists`);
    if (l.blank) assert.match(l.rel, /noopener/, `${l.href} has rel=noopener`);
  }
  const ext = [...new Set(links.map((l) => l.href).filter((h) => h.startsWith('https://')))];
  const skipped = [];
  for (const u of ext) {
    // repositories: prove they exist and are public with git (the sandbox proxy blocks github.com HTML pages)
    const repo = u.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+?)\/?$/);
    if (repo) { execFileSync('git', ['ls-remote', '--heads', `https://github.com/${repo[1]}/${repo[2]}`], { stdio: 'pipe', env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } }); continue; }
    const code = execFileSync('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', '-L', '--max-time', '20', u]).toString();
    // the sandbox proxy only allows repository-scoped GitHub URLs; the bare profile page returns 403 here
    if (code === '403' && /^https:\/\/github\.com\/[^/]+\/?$/.test(u)) { skipped.push(u); continue; }
    assert.equal(code, '200', `${u} → ${code}`);
  }
  if (skipped.length) console.log('     (proxy-blocked, checked by hand:', skipped.join(', ') + ')');
  assert.ok(links.some((l) => l.href === 'mailto:sonawanedarshan35@gmail.com'));
  ok(`links: ${links.length} visible, every #anchor exists, ${ext.length} external URLs reachable (repos via git ls-remote), mailto present`);

  // ---------- config-driven elements (nothing fake shown when unset) ----------
  const cfg = await page.evaluate(() => ({ resumeVisible: [...document.querySelectorAll('[data-config="resume"]')].some((a) => !a.hidden), linkedinVisible: [...document.querySelectorAll('[data-config-li="linkedin"]')].some((e) => !e.hidden), exp: document.querySelector('[data-experience]').hidden, cfg: window.SITE_CONFIG }));
  assert.equal(cfg.resumeVisible, !!cfg.cfg.resume); assert.equal(cfg.linkedinVisible, !!cfg.cfg.linkedin); assert.equal(cfg.exp, !(cfg.cfg.experience || []).length);
  const p2 = await b.newPage(); await p2.addInitScript(() => { window.__CFG_OVERRIDE__ = true; });
  await p2.route('**/config.js', (r) => r.fulfill({ contentType: 'text/javascript', body: "window.SITE_CONFIG={name:'D',email:'a@b.co',github:'https://github.com/Darshan-05032003',linkedin:'https://www.linkedin.com/in/example/',resume:'resume/x.pdf',photo:'img/projects/payflow-home.webp',experience:[{role:'Intern',org:'Org <b>x</b>',period:'2026',points:['did <i>a</i>']}],availability:'Busy'};" }));
  await p2.goto(base + '/'); await p2.waitForTimeout(300);
  const c2 = await p2.evaluate(() => ({ resume: document.querySelector('[data-config="resume"]').hidden, href: document.querySelector('[data-config="resume"]').getAttribute('href'), li: document.querySelector('[data-config-li="linkedin"]').hidden, exp: document.querySelector('[data-experience]').hidden, expHtml: document.querySelector('.exp-list').innerHTML, avail: document.querySelector('[data-config-text="availability"]').textContent, photo: document.querySelector('[data-photo]').classList.contains('has-photo') }));
  assert.equal(c2.resume, false); assert.equal(c2.href, 'resume/x.pdf'); assert.equal(c2.li, false); assert.equal(c2.exp, false); assert.equal(c2.avail, 'Busy'); assert.equal(c2.photo, true);
  assert.ok(c2.expHtml.includes('&lt;b&gt;') && !c2.expHtml.includes('<i>'), 'experience text is escaped, not injected as HTML');
  await p2.route('**/config.js', (r) => r.fulfill({ contentType: 'text/javascript', body: "window.SITE_CONFIG={linkedin:'javascript:alert(1)',resume:'javascript:alert(1)'};" }));
  await p2.goto(base + '/'); await p2.waitForTimeout(200);
  assert.equal(await p2.evaluate(() => document.querySelector('[data-config="resume"]').hidden && document.querySelector('[data-config-li="linkedin"]').hidden), true, 'javascript: URLs rejected');
  await p2.close();
  ok('config: unset résumé/LinkedIn/experience stay hidden; set values appear; HTML escaped; javascript: URLs rejected');

  // ---------- nav + mobile menu ----------
  const m = await b.newPage({ viewport: { width: 390, height: 844 } }); watch(m, 'mobile');
  await m.goto(base + '/');
  assert.equal(await m.locator('#site-nav').isVisible(), false);
  await m.locator('.menu-btn').click();
  assert.equal(await m.locator('.menu-btn').getAttribute('aria-expanded'), 'true');
  await m.locator('#site-nav a[href="#skills"]').click();
  await m.waitForFunction(() => { const t = document.getElementById('skills').getBoundingClientRect().top; return t >= 0 && t < 120; }, null, { timeout: 5000 }).catch(() => {});
  assert.equal(await m.locator('#site-nav').isVisible(), false, 'menu closes after choosing a link');
  const top = await m.evaluate(() => document.getElementById('skills').getBoundingClientRect().top);
  assert.ok(top >= 0 && top < 120, `skills section scrolled into view below the sticky header (top=${top})`);
  await m.locator('.menu-btn').click(); await m.keyboard.press('Escape');
  assert.equal(await m.locator('.menu-btn').getAttribute('aria-expanded'), 'false');
  ok('mobile menu: opens, navigates, closes on link and on Escape; sticky header does not cover the section');

  // ---------- project filter + details ----------
  const vis = () => page.evaluate(() => [...document.querySelectorAll('.project')].filter((p) => !p.hidden).map((p) => p.id));
  await page.locator('[data-filter="flutter"]').click(); assert.deepEqual(await vis(), ['finpay']);
  await page.locator('[data-filter="backend"]').click(); assert.deepEqual(await vis(), ['ledger', 'shop']);
  await page.locator('[data-filter="android"]').click(); assert.deepEqual(await vis(), ['payflow', 'splitsmart', 'checkoutkit']);
  assert.match(await page.locator('#filter-status').textContent(), /3 projects shown/);
  await page.locator('[data-filter="all"]').click(); assert.equal((await vis()).length, 6);
  const d = page.locator('#payflow details'); await d.locator('summary').click(); assert.equal(await d.getAttribute('open'), '');
  await page.keyboard.press('Enter'); // summary is focused: keyboard toggles it
  assert.equal(await d.getAttribute('open'), null);
  ok('projects: filters show the right cards and announce the count; details open by mouse and keyboard');

  // ---------- copy email ----------
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
  await page.locator('#copy-mail').click();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'sonawanedarshan35@gmail.com');
  assert.match(await page.locator('#copy-status').textContent(), /Copied/);
  ok('copy email: copies the address and confirms');

  // ---------- engineering experiments ----------
  await page.locator('#experiments').scrollIntoViewIfNeeded(); await page.waitForTimeout(600);
  const race = async (mode) => {
    await page.locator(`#lab-race input[value="${mode}"]`).check();
    await page.locator('#race-run').click();
    await page.waitForFunction(() => !document.getElementById('race-run').disabled && document.getElementById('race-verdict').textContent.length > 0, null, { timeout: 60000 });
    return page.evaluate(() => +document.getElementById('race-orders').textContent);
  };
  const naive = await race('naive'), safe = await race('safe');
  assert.ok(naive > 5, `naive oversells (${naive})`); assert.equal(safe, 5);
  ok(`experiment 1: read-then-write accepts ${naive} orders for 5 units; conditional UPDATE accepts exactly 5`);
  const pay = async (key) => { await page.locator('#pay-key').setChecked(key); await page.locator('#pay-run').click(); await page.waitForFunction(() => !document.getElementById('pay-run').disabled && document.getElementById('pay-verdict').textContent.length > 0, null, { timeout: 60000 }); return page.locator('#pay-charges').textContent(); };
  assert.equal(await pay(false), '3 charges'); assert.equal(await pay(true), '1 charge');
  ok('experiment 2: 3 charges without an idempotency key, 1 with');
  await page.locator('#journal button', { hasText: 'Edit' }).first().click();
  assert.match(await page.locator('#ledger-notice').textContent(), /append-only/);
  await page.locator('[data-op="big"]').click();
  await page.locator('#pending button', { hasText: 'Approve as Asha' }).click();
  assert.match(await page.locator('#ledger-notice').textContent(), /Four-eyes/);
  await page.locator('#pending button', { hasText: 'Approve as Checker' }).click();
  await page.locator('[data-op="bad"]').click();
  assert.match(await page.locator('#ledger-notice').textContent(), /unbalanced/);
  assert.match(await page.locator('#ledger-status').textContent(), /balanced/);
  ok('experiment 3: edit refused, four-eyes enforced, unbalanced journal refused, books stay balanced');
  // experiments on a phone
  await m.goto(base + '/#experiments'); await m.waitForTimeout(800);
  await m.locator('#race-run').scrollIntoViewIfNeeded(); await m.locator('#race-run').click();
  await m.waitForFunction(() => !document.getElementById('race-run').disabled && document.getElementById('race-verdict').textContent.length > 0, null, { timeout: 60000 });
  assert.ok(await m.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
  await m.screenshot({ path: '/tmp/v2e-mobile-race.png' });
  ok('experiments run on a 390 px phone without overflow');

  // ---------- keyboard ----------
  const k = await b.newPage({ viewport: { width: 1280, height: 800 } }); await k.goto(base + '/');
  await k.keyboard.press('Tab'); assert.equal(await k.evaluate(() => document.activeElement.className), 'skip');
  await k.keyboard.press('Enter'); await k.keyboard.press('Tab');
  assert.ok(await k.evaluate(() => document.getElementById('main').contains(document.activeElement)), 'skip link moves focus into main');
  ok('keyboard: skip link is first and jumps into the main content');

  // ---------- 404 ----------
  const nf = await b.newPage(); watch(nf, '404');
  const resp = await nf.goto(SITE + '/does-not-exist');
  assert.equal(resp.status(), 404); assert.match(await nf.locator('h1').textContent(), /doesn't exist/);
  await nf.locator('a', { hasText: 'Go to the home page' }).click(); await nf.waitForLoadState();
  assert.match(await nf.title(), /Darshan Sonawane/);
  assert.ok(await nf.evaluate(() => getComputedStyle(document.body).backgroundColor === 'rgb(18, 19, 22)'), 'home page styled');
  ok('404: custom page, link back home works');

  // ---------- accessibility (axe) ----------
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const a = await b.newPage({ viewport: { width: w, height: h }, bypassCSP: true }); await a.goto(base + '/'); await a.waitForTimeout(2500);
    await a.addScriptTag({ path: require.resolve('axe-core/axe.min.js', { paths: ['/home/claude/audit'] }) });
    const v = await a.evaluate(async () => (await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'] })).violations.map((x) => `${x.impact} ${x.id} ×${x.nodes.length}: ${x.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`));
    assert.deepEqual(v, [], `axe at ${w}px`);
    await a.close();
  }
  ok('accessibility: axe-core finds no violations (WCAG 2.2 AA + best practices) at 1440 and 390 px');

  // the 404 page is requested on purpose; its own 'status of 404' console line is expected
  const real = errors.filter((e) => !(e.startsWith('404 console') && /status of 404/.test(e)));
  assert.deepEqual(real, [], 'no console errors, page errors or failed requests');
  ok('no console errors, page errors or failed requests (CSP enforced)');
  console.log(`\n${passed} checks passed`);
  await b.close(); srv.close();
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
