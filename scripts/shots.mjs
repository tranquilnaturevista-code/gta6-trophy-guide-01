// Takes this entry's screenshots for real: serves app/ on a local port, opens each
// scene from shots.json in headless Chromium, waits for window.__shotReady, and saves
// a JPEG screenshot. It also records every network request the page makes, so the app
// can be proven to load nothing from outside, and exercises the tracker (ticking a
// trophy updates the progress line and survives a reload). Run from the repo root:
//   node scripts/shots.mjs
// playwright-core lives outside the repo (in /tmp/pw) so the entry's own files stay
// clean; createRequire resolves it from that absolute path.
import { createRequire } from 'node:module';
const { chromium } = createRequire('/tmp/pw/node_modules/playwright-core/index.js')('playwright-core');
import { spawn } from 'node:child_process';
import { statSync } from 'node:fs';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('..', import.meta.url));
const PORT = 8902;
const BASE = `http://127.0.0.1:${PORT}`;

const shots = JSON.parse(readFileSync(join(repo, 'shots.json'), 'utf8'));

function waitForServer(url, tries = 40) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      fetch(url)
        .then((r) => (r.ok ? resolve() : setTimeout(() => attempt(n - 1), 250)))
        .catch(() => (n <= 0 ? reject(new Error('server did not come up')) : setTimeout(() => attempt(n - 1), 250)));
    };
    attempt(tries);
  });
}

const server = spawn('node', ['serve.ts', '--port', String(PORT)], { cwd: repo, stdio: 'ignore' });
try {
  await waitForServer(`${BASE}/index.html`);

  const browser = await chromium.launch();
  try {
    const requests = [];
    for (const shot of shots) {
      const page = await browser.newPage({ viewport: { width: shot.w, height: shot.h } });
      page.on('request', (req) => requests.push(req.url()));
      // Pre-seed the tracker state so the screenshots show real progress.
      await page.addInitScript((preset) => {
        localStorage.setItem('leonida-legend-v1', JSON.stringify(preset));
      }, shot.preset);
      await page.goto(`${BASE}/index.html${shot.query}`, { waitUntil: 'load' });
      await page.waitForFunction(() => window.__shotReady === true, null, { timeout: 15000 });
      if (shot.scroll) {
        await page.evaluate((sel) => {
          document.querySelector(sel)?.scrollIntoView({ block: 'start' });
          window.scrollBy(0, -140); // keep the sticky filter bar clear of the section title
        }, shot.scroll);
        await page.waitForTimeout(250);
      }
      const out = join(repo, 'screenshots', shot.name);
      await page.screenshot({ path: out, type: 'jpeg', quality: 82 });
      const size = statSync(out).size;
      console.log(`${shot.name}: ${shot.w}x${shot.h} viewport, ${(size / 1024).toFixed(1)} KiB — ${shot.view}`);
      if (size > 262144) throw new Error(`${shot.name} is over the 256 KiB cap`);
      await page.close();
    }

    // Network check: every request the app made must be the local server (or data:).
    const outside = requests.filter((u) => !u.startsWith(BASE) && !u.startsWith('data:'));
    console.log(`network requests: ${requests.length} total, ${outside.length} outside localhost`);
    if (outside.length) throw new Error('OUTSIDE REQUESTS: ' + outside.join(', '));

    // Tracker check: tick a trophy, watch the progress line move, reload, see it stick.
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(`${BASE}/index.html`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__shotReady === true, null, { timeout: 15000 });
    const before = await page.textContent('#progressText');
    await page.locator('#trophy-15 input[type="checkbox"]').check();
    const after = await page.textContent('#progressText');
    console.log(`tracker: progress before tick: ${before} | after ticking Cunning Stunts: ${after}`);
    if (before === after) throw new Error('progress did not move after ticking a trophy');
    await page.reload({ waitUntil: 'load' });
    await page.waitForFunction(() => window.__shotReady === true, null, { timeout: 15000 });
    const persisted = await page.locator('#trophy-15 input[type="checkbox"]').isChecked();
    console.log(`tracker: Cunning Stunts still ticked after reload: ${persisted}`);
    if (!persisted) throw new Error('progress did not persist across reload');
    await page.close();

    // Spoiler check: with spoilers on, hidden trophies show the mask, not their names.
    const spooky = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await spooky.addInitScript(() => {
      localStorage.setItem('leonida-legend-v1', JSON.stringify({ earned: [], spoilers: true }));
    });
    await spooky.goto(`${BASE}/index.html`, { waitUntil: 'load' });
    await spooky.waitForFunction(() => window.__shotReady === true, null, { timeout: 15000 });
    const masked = await spooky.locator('.spoiler-mask, .trophy-head h3').allTextContents();
    const hiddenNamesShown = masked.filter((t) => t.includes('Gone Fishing') || t.includes('Breakfast Run'));
    console.log(`spoiler mode: hidden story names visible: ${hiddenNamesShown.length} (must be 0)`);
    if (hiddenNamesShown.length) throw new Error('spoiler mode leaked a hidden trophy name');
    await spooky.close();
    console.log('ALL SCREENSHOT + TRACKER CHECKS PASSED');
  } finally {
    await browser.close();
  }
} finally {
  server.kill();
}
