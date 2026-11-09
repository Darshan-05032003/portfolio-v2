// Build: copy src/ to docs/ (Cloudflare Pages / GitHub Pages output), fill in the site URL and date.
// Usage: SITE_URL=https://example.pages.dev node build.js
const fs = require('fs'), path = require('path');
const SITE_URL = (process.env.SITE_URL || 'https://darshan-05032003.github.io/portfolio-v2').replace(/\/$/, '');
const src = path.join(__dirname, 'src'), out = path.join(__dirname, 'docs');
fs.rmSync(out, { recursive: true, force: true });
const textExt = new Set(['.html', '.xml', '.txt', '.css', '.js']);
(function copy(dir, rel = '') {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f), o = path.join(out, rel, f);
    if (fs.statSync(p).isDirectory()) { fs.mkdirSync(o, { recursive: true }); copy(p, path.join(rel, f)); continue; }
    fs.mkdirSync(path.dirname(o), { recursive: true });
    if (textExt.has(path.extname(f))) fs.writeFileSync(o, fs.readFileSync(p, 'utf8').replaceAll('%SITE_URL%', SITE_URL).replaceAll('%DATE%', new Date().toISOString().slice(0, 10)));
    else fs.copyFileSync(p, o);
  }
})(src);
const bytes = (d) => fs.readdirSync(d).reduce((n, f) => { const p = path.join(d, f); return n + (fs.statSync(p).isDirectory() ? bytes(p) : fs.statSync(p).size); }, 0);
console.log('built docs/ for', SITE_URL, '-', Math.round(bytes(out) / 1024), 'KB total');
