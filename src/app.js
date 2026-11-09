/* Page behaviour: personal config, mobile menu, active nav link, project filter, copy-email, and the
   engineering experiments (labs.js, which uses window.Sim and window.Motion). No dependencies. */
import { initLabs } from './labs.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const C = window.SITE_CONFIG || {};
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- config: fill links, hide anything not configured ---------- */
export function applyConfig(cfg, doc = document) {
  const safeUrl = (u) => typeof u === 'string' && /^(https:\/\/|mailto:|[a-z0-9][\w\-./]*$)/i.test(u) ? u : '';
  const hrefs = { github: safeUrl(cfg.github), linkedin: safeUrl(cfg.linkedin), mailto: cfg.email ? 'mailto:' + cfg.email : '' };
  doc.querySelectorAll('[data-config-href]').forEach((a) => { const v = hrefs[a.dataset.configHref]; if (v) a.href = v; });
  doc.querySelectorAll('[data-config-li]').forEach((li) => { li.hidden = !hrefs[li.dataset.configLi]; });
  const resume = safeUrl(cfg.resume);
  doc.querySelectorAll('[data-config="resume"]').forEach((a) => { if (resume) { a.href = resume; a.hidden = false; } else { a.hidden = true; } });
  doc.querySelectorAll('[data-config-text]').forEach((n) => { const v = cfg[n.dataset.configText]; if (typeof v === 'string' && v) n.textContent = v; });
  const photo = safeUrl(cfg.photo), box = doc.querySelector('[data-photo]');
  if (box && photo) {
    const img = box.querySelector('img');
    img.addEventListener('load', () => { img.hidden = false; box.classList.add('has-photo'); }, { once: true });
    img.addEventListener('error', () => { img.hidden = true; box.classList.remove('has-photo'); }, { once: true });
    img.src = photo;
  }
  const exp = Array.isArray(cfg.experience) ? cfg.experience.filter((e) => e && e.role && e.org) : [];
  const wrap = doc.querySelector('[data-experience]');
  if (wrap) {
    const list = wrap.querySelector('.exp-list'); list.textContent = '';
    for (const e of exp) {
      const li = doc.createElement('li'), head = doc.createElement('div'); head.className = 'exp-head';
      const b = doc.createElement('b'); b.textContent = `${e.role}, ${e.org}`;
      const s = doc.createElement('span'); s.textContent = e.period || '';
      head.append(b, s); li.append(head);
      if (Array.isArray(e.points) && e.points.length) { const ul = doc.createElement('ul'); for (const p of e.points) { const x = doc.createElement('li'); x.textContent = String(p); ul.append(x); } li.append(ul); }
      list.append(li);
    }
    wrap.hidden = exp.length === 0;
  }
}

/* ---------- project filter ---------- */
export function filterProjects(cat, doc = document) {
  let shown = 0;
  doc.querySelectorAll('.project[data-cat], .also li[data-cat]').forEach((el) => {
    const on = cat === 'all' || el.dataset.cat === cat; el.hidden = !on; if (on && el.classList.contains('project')) shown++;
  });
  doc.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === cat)));
  return shown;
}

function init() {
  applyConfig(C);
  const year = $('#year'); if (year) year.textContent = String(new Date().getFullYear());

  // mobile menu
  const btn = $('.menu-btn'), nav = $('#site-nav');
  const close = () => { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); };
  btn.addEventListener('click', () => { const open = !nav.classList.contains('open'); nav.classList.toggle('open', open); btn.setAttribute('aria-expanded', String(open)); if (open) nav.querySelector('a').focus(); });
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('open')) { close(); btn.focus(); } });
  document.addEventListener('click', (e) => { if (nav.classList.contains('open') && !e.target.closest('.site-header')) close(); });

  // highlight the section in view
  const links = new Map($$('#site-nav a').map((a) => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) if (en.isIntersecting) { links.forEach((a) => a.removeAttribute('aria-current')); const a = links.get(en.target.id); if (a) a.setAttribute('aria-current', 'true'); }
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });

  // project filter
  const status = $('#filter-status');
  $$('[data-filter]').forEach((b) => b.addEventListener('click', () => {
    const n = filterProjects(b.dataset.filter);
    status.textContent = `${n} project${n === 1 ? '' : 's'} shown`;
  }));

  // copy email
  const copyBtn = $('#copy-mail'), copyStatus = $('#copy-status');
  copyBtn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(C.email || 'sonawanedarshan35@gmail.com'); copyStatus.textContent = 'Copied. Paste it into your mail app.'; }
    catch { copyStatus.textContent = 'Copy failed. The address is ' + (C.email || 'sonawanedarshan35@gmail.com') + '.'; }
  });

  // experiments: start them only when the section is near, so the page loads quickly
  const exp = $('#experiments');
  const start = () => { try { initLabs({ reduce, setStatus: (id, text, cls) => { const n = document.getElementById(id); if (n) { n.textContent = text; n.className = 'status' + (cls ? ' ' + cls : ''); } } }); } catch (err) { exp.querySelectorAll('.lab-foot .btn, .ops .btn').forEach((b) => { b.disabled = true; }); const p = document.createElement('p'); p.className = 'note'; p.textContent = 'The simulations could not start in this browser.'; exp.querySelector('.wrap').append(p); console.error(err); } };
  let started = false;
  const once = () => { if (!started) { started = true; start(); } };
  if ('IntersectionObserver' in window) {
    const lazy = new IntersectionObserver((en) => { if (en.some((e) => e.isIntersecting)) { lazy.disconnect(); once(); } }, { rootMargin: '600px 0px' });
    lazy.observe(exp);
  }
  // also start once the page is idle, so they're ready even if the visitor jumps straight to them
  addEventListener('load', () => (window.requestIdleCallback || ((f) => setTimeout(f, 1500)))(once, { timeout: 2500 }));
}

if (typeof window !== 'undefined' && !window.__NO_AUTO_INIT__) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
}
