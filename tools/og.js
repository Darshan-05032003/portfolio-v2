// Renders tools/og.html to src/og.png (1200x630 social preview). Run: node tools/og.js
const { chromium } = require(process.env.PW || '/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] }); const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.goto('file://' + path.join(__dirname, 'og.html')); await p.waitForTimeout(300); await p.screenshot({ path: path.join(__dirname, '..', 'src', 'og.png') }); await b.close(); })();
