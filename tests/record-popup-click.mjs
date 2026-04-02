/**
 * Records the popup interaction:
 * popup opens → arrow-down x2 to item 3 → Enter to copy
 * Output: demo/public/popup-click.webm
 */
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extensionPath = path.resolve(__dirname, '..', 'dist-chrome');
const publicDir = path.resolve(__dirname, '..', 'demo', 'public');
const rawDir = path.join(publicDir, '_raw');

fs.mkdirSync(rawDir, { recursive: true });

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
    recordVideo: { dir: rawDir, size: { width: 380, height: 500 } },
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

  const page = await context.newPage();
  await page.setViewportSize({ width: 380, height: 500 });
  await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`);
  await page.waitForSelector('#search', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(300);

  // Seed clips — "database migration" is item 3 (offset puts it third by recency)
  await page.evaluate(async () => {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('clippy-db', 1);
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

        // Order by recency (lowest offset = most recent = top of list)
        const clips = [
          { content: 'https://github.com/example/project',                                  sourceTitle: 'GitHub', sourceUrl: 'https://github.com',        offset: 2 * 60000 },
          { content: 'contact@example.com',                                                  sourceTitle: 'Mail',   sourceUrl: 'https://mail.example.com',  offset: 8 * 60000 },
          { content: 'The database migration completed successfully with zero downtime',      sourceTitle: 'Slack',  sourceUrl: 'https://app.slack.com',     offset: 22 * 60000 },
          { content: 'Meeting notes: ship the MVP by end of sprint',                         sourceTitle: 'Notion', sourceUrl: 'https://notion.so',         offset: 4 * 3600000 },
          { content: 'Design review: increase contrast on sidebar nav',                      sourceTitle: 'Figma',  sourceUrl: 'https://figma.com',         offset: 8 * 3600000 },
        ];

        const tx = db.transaction('clips', 'readwrite');
        const store = tx.objectStore('clips');
        for (const { content, sourceTitle, sourceUrl, offset } of clips) {
          const enc = new TextEncoder();
          const buf = await crypto.subtle.digest('SHA-256', enc.encode(content));
          const hash = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
          let type = 'text';
          if (/^https?:\/\/[^\s]+$/.test(content.trim())) type = 'url';
          else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(content.trim())) type = 'email';
          store.put({ id: crypto.randomUUID(), content, type, sourceTitle, sourceUrl, timestamp: now - offset, pinned: 0, isSnippet: 0, hash, charCount: content.length });
        }
        tx.oncomplete = () => { db.close(); resolve(null); };
        tx.onerror = () => { db.close(); reject(new Error(String(tx.error))); };
      };
      req.onerror = () => reject(new Error(String(req.error)));
    });
  });

  await page.reload();
  await page.waitForSelector('#search', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(600);

  // Arrow down twice to land on item 3
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(350);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(350);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(500);

  // Press Enter to copy
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400).catch(() => {});

  const video = page.video();
  await page.close();
  await video.saveAs(path.join(publicDir, 'popup-click.webm'));
  console.log('Saved popup-click.webm');

  await context.close();
}

run().catch((err) => { console.error(err); process.exit(1); });
