/**
 * Generates store screenshots for Chrome Web Store and Firefox AMO.
 * Outputs to store/screenshots/:
 *   01-history.png   - clipboard list view       (1280x800)
 *   02-search.png    - fuzzy search in action     (1280x800)
 *   03-favorites.png - favorites tab              (1280x800)
 *   04-snippets.png  - snippets tab               (1280x800)
 *   05-options.png   - settings page              (1280x800)
 *   promo-tile-440x280.png - Chrome promo tile    (440x280)
 *
 * Usage:
 *   npm run screenshots
 */

import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extensionPath = path.resolve(__dirname, '..', 'dist-chrome');
const outDir = path.resolve(__dirname, '..', 'store', 'screenshots');
const rawDir = path.join(outDir, '_raw');

fs.mkdirSync(rawDir, { recursive: true });

const CLIPS = [
  { content: 'Design review: increase contrast on sidebar nav elements', sourceTitle: 'Figma', sourceUrl: 'https://figma.com', offset: 3 * 86400000 },
  { content: 'https://docs.google.com/spreadsheets/d/1abc123/edit', sourceTitle: 'Gmail', sourceUrl: 'https://mail.google.com', offset: 2 * 86400000 + 4 * 3600000 },
  { content: 'Database migration completed with zero downtime', sourceTitle: 'Slack', sourceUrl: 'https://app.slack.com', offset: 86400000 + 2 * 3600000 },
  { content: 'Remember to pick up groceries: eggs, milk, bread, avocados', sourceTitle: 'Google Keep', sourceUrl: 'https://keep.google.com', offset: 22 * 3600000 },
  { content: 'Meeting notes: ship the MVP by end of sprint', sourceTitle: 'Notion', sourceUrl: 'https://notion.so', offset: 8 * 3600000 },
  { content: '{"name":"Clipjar","version":"1.0.0","description":"Clipboard manager"}', sourceTitle: 'GitHub', sourceUrl: 'https://github.com', offset: 4 * 3600000 },
  { content: "const greet = (name) => `Hello, ${name}!`;\nconsole.log(greet('Clipjar'));", sourceTitle: 'GitHub', sourceUrl: 'https://github.com', offset: 2 * 3600000 },
  { content: 'contact@example.com', sourceTitle: 'Mail', sourceUrl: 'https://mail.example.com', offset: 22 * 60000 },
  { content: 'https://github.com/example/project', sourceTitle: 'GitHub', sourceUrl: 'https://github.com', offset: 8 * 60000 },
  { content: 'The quick brown fox jumps over the lazy dog', sourceTitle: 'Example', sourceUrl: 'https://example.com', offset: 2 * 60000 },
];

async function seed(page) {
  await page.evaluate(async (clips) => {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('clipjar-db', 1);
      req.onupgradeneeded = (e) => {
        const d = e.target.result;
        if (!d.objectStoreNames.contains('clips')) {
          const s = d.createObjectStore('clips', { keyPath: 'id' });
          s.createIndex('hash', 'hash', { unique: true });
          s.createIndex('timestamp', 'timestamp');
          s.createIndex('pinned', 'pinned');
          s.createIndex('isSnippet', 'isSnippet');
        }
      };
      req.onsuccess = async () => {
        const db = req.result;
        const now = Date.now();
        const clearTx = db.transaction('clips', 'readwrite');
        clearTx.objectStore('clips').clear();
        await new Promise((r) => { clearTx.oncomplete = r; clearTx.onerror = r; });
        const tx = db.transaction('clips', 'readwrite');
        const store = tx.objectStore('clips');
        for (const { content, sourceTitle, sourceUrl, offset } of clips) {
          const enc = new TextEncoder();
          const buf = await crypto.subtle.digest('SHA-256', enc.encode(content));
          const hash = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
          let type = 'text';
          if (/^https?:\/\/[^\s]+$/.test(content.trim())) type = 'url';
          else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(content.trim())) type = 'email';
          else if (/^\s*[\[{]/.test(content.trim())) { try { JSON.parse(content); type = 'json'; } catch {} }
          else if (/\b(const|function|return|def|import)\b/.test(content) && content.includes('\n')) type = 'code';
          store.put({ id: crypto.randomUUID(), content, type, sourceTitle, sourceUrl, timestamp: now - offset, pinned: 0, isSnippet: 0, hash, charCount: content.length });
        }
        tx.oncomplete = () => { db.close(); resolve(null); };
        tx.onerror = () => { db.close(); reject(new Error(String(tx.error))); };
      };
      req.onerror = () => reject(new Error(String(req.error)));
    });
  }, CLIPS);
}

async function openPopup(context, extensionId) {
  const page = await context.newPage();
  await page.setViewportSize({ width: 380, height: 500 });
  await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`);
  await page.waitForSelector('#search', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(400);
  return page;
}

function frameHtml(imgPath, title, subtitle) {
  const rel = path.basename(imgPath);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  width: 1280px; height: 800px; overflow: hidden;
  background: radial-gradient(ellipse at 65% 40%, #1e0a4a 0%, #0d0620 40%, #050210 100%);
  display: flex; align-items: center; padding: 0 80px; gap: 80px;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}
body::before {
  content: '';
  position: absolute; inset: 0;
  background-image: linear-gradient(rgba(109,40,217,0.06) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(109,40,217,0.06) 1px, transparent 1px);
  background-size: 60px 60px;
}
.left { flex: 1; position: relative; z-index: 1; }
.logo { display: flex; align-items: center; gap: 12px; margin-bottom: 36px; }
.logo-icon { font-size: 32px; }
.logo-name { font-size: 22px; font-weight: 700; color: rgba(255,255,255,0.9); letter-spacing: -0.01em; }
h1 {
  font-size: 46px; font-weight: 800; line-height: 1.1;
  letter-spacing: -0.03em; color: #fff; margin-bottom: 20px;
}
p {
  font-size: 20px; line-height: 1.6;
  color: rgba(255,255,255,0.55); max-width: 380px;
}
.right { position: relative; z-index: 1; flex-shrink: 0; }
.browser-chrome {
  background: #1c1c2e;
  border-radius: 12px;
  box-shadow: 0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08),
              0 0 60px rgba(109,40,217,0.3);
  overflow: hidden;
}
.browser-bar {
  padding: 10px 14px;
  display: flex; align-items: center; gap: 8px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.dot { width: 10px; height: 10px; border-radius: 50%; }
.dot-r { background: #ff5f57; }
.dot-y { background: #febc2e; }
.dot-g { background: #28c840; }
img { display: block; width: 380px; height: 500px; }
</style>
</head>
<body>
  <div class="left">
    <div class="logo">
      <span class="logo-icon">📋</span>
      <span class="logo-name">Clipjar</span>
    </div>
    <h1>${title}</h1>
    <p>${subtitle}</p>
  </div>
  <div class="right">
    <div class="browser-chrome">
      <div class="browser-bar">
        <div class="dot dot-r"></div>
        <div class="dot dot-y"></div>
        <div class="dot dot-g"></div>
      </div>
      <img src="${rel}" />
    </div>
  </div>
</body>
</html>`;
}

function promoHtml() {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  width: 440px; height: 280px; overflow: hidden;
  background: radial-gradient(ellipse at 50% 40%, #1e0a4a 0%, #0d0620 45%, #050210 100%);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}
body::before {
  content: '';
  position: absolute; inset: 0;
  background-image: linear-gradient(rgba(109,40,217,0.07) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(109,40,217,0.07) 1px, transparent 1px);
  background-size: 40px 40px;
}
.icon { font-size: 52px; position: relative; z-index: 1; }
.name {
  font-size: 48px; font-weight: 800; color: #fff;
  letter-spacing: -0.04em; position: relative; z-index: 1;
}
.tag {
  font-size: 16px; color: rgba(255,255,255,0.5);
  font-weight: 400; position: relative; z-index: 1;
}
.badge {
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  color: #fff; font-size: 13px; font-weight: 600;
  padding: 6px 18px; border-radius: 100px;
  position: relative; z-index: 1; margin-top: 4px;
  box-shadow: 0 4px 16px rgba(109,40,217,0.5);
}
</style>
</head>
<body>
  <div class="icon">📋</div>
  <div class="name">Clipjar</div>
  <div class="tag">Free. Private. Keyboard-first.</div>
  <div class="badge">Clipboard Manager</div>
</body>
</html>`;
}

async function run() {
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      '--headless=new',
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-first-run',
      '--no-default-browser-check',
    ],
    colorScheme: 'dark',
  });

  let sw;
  if (context.serviceWorkers().length === 0) {
    sw = await context.waitForEvent('serviceworker', { timeout: 10000 });
  } else {
    sw = context.serviceWorkers()[0];
  }
  const extensionId = sw.url().split('/')[2];
  console.log('Extension ID:', extensionId);

  // Seed once in a throwaway page
  const setup = await openPopup(context, extensionId);
  await seed(setup);
  await setup.close();

  // ── 01: history ──────────────────────────────────────────────────────────
  {
    const page = await openPopup(context, extensionId);
    await page.waitForTimeout(300);
    const rawPath = path.join(rawDir, 'popup-history.png');
    await page.screenshot({ path: rawPath });
    await page.close();

    const framePath = path.join(rawDir, 'frame-history.html');
    fs.writeFileSync(framePath, frameHtml(
      rawPath,
      'Your clipboard history,<br>always within reach',
      'Clipjar saves everything you copy with source, timestamp, and type detection. Get it back in one keystroke.',
    ));
    const fp = await context.newPage();
    await fp.setViewportSize({ width: 1280, height: 800 });
    await fp.goto(`file://${framePath}`);
    await fp.waitForTimeout(200);
    await fp.screenshot({ path: path.join(outDir, '01-history.png') });
    await fp.close();
    console.log('01-history.png');
  }

  // ── 02: search ───────────────────────────────────────────────────────────
  {
    const page = await openPopup(context, extensionId);
    await page.waitForTimeout(200);
    const search = page.locator('#search');
    await search.click();
    for (const ch of 'github') { await page.keyboard.type(ch); await page.waitForTimeout(80); }
    await page.waitForTimeout(400);
    const rawPath = path.join(rawDir, 'popup-search.png');
    await page.screenshot({ path: rawPath });
    await page.close();

    const framePath = path.join(rawDir, 'frame-search.html');
    fs.writeFileSync(framePath, frameHtml(
      rawPath,
      'Find anything<br>in milliseconds',
      'Fuzzy search across your entire clipboard history. Works with partial matches and typos.',
    ));
    const fp = await context.newPage();
    await fp.setViewportSize({ width: 1280, height: 800 });
    await fp.goto(`file://${framePath}`);
    await fp.waitForTimeout(200);
    await fp.screenshot({ path: path.join(outDir, '02-search.png') });
    await fp.close();
    console.log('02-search.png');
  }

  // ── 03: favorites ────────────────────────────────────────────────────────
  {
    const page = await openPopup(context, extensionId);
    await page.waitForTimeout(200);
    // Pin first two clips
    for (let i = 0; i < 2; i++) {
      const clip = page.locator('.clip-item').nth(i);
      await clip.hover();
      await page.waitForTimeout(150);
      const pinBtn = clip.locator('button[title*="in"]').first();
      if (await pinBtn.count() > 0) { await pinBtn.click(); await page.waitForTimeout(250); }
    }
    await page.locator('button[data-tab="favorites"]').click();
    await page.waitForTimeout(400);
    const rawPath = path.join(rawDir, 'popup-favorites.png');
    await page.screenshot({ path: rawPath });
    await page.close();

    const framePath = path.join(rawDir, 'frame-favorites.html');
    fs.writeFileSync(framePath, frameHtml(
      rawPath,
      'Pin the clips<br>you reuse most',
      'Star any item to keep it at the top. Perfect for addresses, account numbers, and boilerplate.',
    ));
    const fp = await context.newPage();
    await fp.setViewportSize({ width: 1280, height: 800 });
    await fp.goto(`file://${framePath}`);
    await fp.waitForTimeout(200);
    await fp.screenshot({ path: path.join(outDir, '03-favorites.png') });
    await fp.close();
    console.log('03-favorites.png');
  }

  // ── 04: snippets ─────────────────────────────────────────────────────────
  {
    // Seed snippets directly into IDB so the list view shows content
    const page = await openPopup(context, extensionId);
    await page.evaluate(async () => {
      const db = await new Promise((resolve, reject) => {
        const r = indexedDB.open('clipjar-db', 1);
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });
      const snippets = [
        { shortcut: ':br',    content: 'Best regards,\nThe Clipjar Team' },
        { shortcut: ':addr',  content: '123 Main Street, Atlanta, GA 30301' },
        { shortcut: ':meet',  content: 'Happy to find time to connect. Here is my calendar link: cal.example.com/clipjar' },
        { shortcut: ':ty',    content: 'Thank you for reaching out! I will follow up shortly.' },
      ];
      const now = Date.now();
      const tx = db.transaction('clips', 'readwrite');
      const store = tx.objectStore('clips');
      for (const { shortcut, content } of snippets) {
        const enc = new TextEncoder();
        const buf = await crypto.subtle.digest('SHA-256', enc.encode(content));
        const hash = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
        store.put({ id: crypto.randomUUID(), content, type: 'text', shortcut, sourceTitle: '', sourceUrl: '', timestamp: now, pinned: 0, isSnippet: 1, hash, charCount: content.length });
      }
      await new Promise((r) => { tx.oncomplete = r; tx.onerror = r; });
      db.close();
    });
    // Reload to pick up the new snippets, then show the snippets tab
    await page.reload();
    await page.waitForSelector('#search', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(400);
    await page.locator('button[data-tab="snippets"]').click();
    await page.waitForTimeout(400);
    const rawPath = path.join(rawDir, 'popup-snippets.png');
    await page.screenshot({ path: rawPath });
    await page.close();

    const framePath = path.join(rawDir, 'frame-snippets.html');
    fs.writeFileSync(framePath, frameHtml(
      rawPath,
      'Type a shortcut,<br>paste a full message',
      'Create text snippets triggered by short codes. Type ;br and it expands to your full email sign-off.',
    ));
    const fp = await context.newPage();
    await fp.setViewportSize({ width: 1280, height: 800 });
    await fp.goto(`file://${framePath}`);
    await fp.waitForTimeout(200);
    await fp.screenshot({ path: path.join(outDir, '04-snippets.png') });
    await fp.close();
    console.log('04-snippets.png');
  }

  // ── 05: options (framed) ─────────────────────────────────────────────────
  {
    // Take raw options screenshot at compact size, then wrap in branded frame
    const rawPage = await context.newPage();
    await rawPage.setViewportSize({ width: 720, height: 480 });
    await rawPage.goto(`chrome-extension://${extensionId}/src/options/index.html`);
    await rawPage.waitForTimeout(800);
    const rawPath = path.join(rawDir, 'options-raw.png');
    await rawPage.screenshot({ path: rawPath });
    await rawPage.close();

    // Build a custom frame for the options page (wider screenshot, no browser chrome)
    const optionsFramePath = path.join(rawDir, 'frame-options.html');
    fs.writeFileSync(optionsFramePath, `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  width: 1280px; height: 800px; overflow: hidden;
  background: radial-gradient(ellipse at 65% 40%, #1e0a4a 0%, #0d0620 40%, #050210 100%);
  display: flex; align-items: center; padding: 0 80px; gap: 80px;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}
body::before {
  content: '';
  position: absolute; inset: 0;
  background-image: linear-gradient(rgba(109,40,217,0.06) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(109,40,217,0.06) 1px, transparent 1px);
  background-size: 60px 60px;
}
.left { flex: 1; position: relative; z-index: 1; }
.logo { display: flex; align-items: center; gap: 12px; margin-bottom: 36px; }
.logo-icon { font-size: 32px; }
.logo-name { font-size: 22px; font-weight: 700; color: rgba(255,255,255,0.9); letter-spacing: -0.01em; }
h1 { font-size: 46px; font-weight: 800; line-height: 1.1; letter-spacing: -0.03em; color: #fff; margin-bottom: 20px; }
p { font-size: 20px; line-height: 1.6; color: rgba(255,255,255,0.55); max-width: 380px; }
.right { position: relative; z-index: 1; flex-shrink: 0; }
.card {
  background: #fff; border-radius: 12px; overflow: hidden;
  box-shadow: 0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08),
              0 0 60px rgba(109,40,217,0.25);
  width: 560px;
}
.card-bar {
  background: #f0f0f0; padding: 10px 14px;
  display: flex; align-items: center; gap: 8px;
  border-bottom: 1px solid #ddd;
}
.dot { width: 10px; height: 10px; border-radius: 50%; }
.dot-r { background: #ff5f57; } .dot-y { background: #febc2e; } .dot-g { background: #28c840; }
img { display: block; width: 560px; }
</style>
</head>
<body>
  <div class="left">
    <div class="logo">
      <span class="logo-icon">📋</span>
      <span class="logo-name">Clipjar</span>
    </div>
    <h1>Customize to your workflow</h1>
    <p>Set your history limit, choose a theme, control snippet expansion, and manage your data.</p>
  </div>
  <div class="right">
    <div class="card">
      <div class="card-bar">
        <div class="dot dot-r"></div>
        <div class="dot dot-y"></div>
        <div class="dot dot-g"></div>
      </div>
      <img src="options-raw.png" />
    </div>
  </div>
</body>
</html>`);
    const fp = await context.newPage();
    await fp.setViewportSize({ width: 1280, height: 800 });
    await fp.goto(`file://${optionsFramePath}`);
    await fp.waitForTimeout(200);
    await fp.screenshot({ path: path.join(outDir, '05-options.png') });
    await fp.close();
    console.log('05-options.png');
  }

  // ── promo tile 440x280 ────────────────────────────────────────────────────
  {
    const framePath = path.join(rawDir, 'promo-tile.html');
    fs.writeFileSync(framePath, promoHtml());
    const fp = await context.newPage();
    await fp.setViewportSize({ width: 440, height: 280 });
    await fp.goto(`file://${framePath}`);
    await fp.waitForTimeout(200);
    await fp.screenshot({ path: path.join(outDir, 'promo-tile-440x280.png') });
    await fp.close();
    console.log('promo-tile-440x280.png');
  }

  await context.close();
  console.log('\nDone! Screenshots saved to store/screenshots/');
}

run().catch((err) => {
  console.error('Screenshot generation failed:', err);
  process.exit(1);
});
