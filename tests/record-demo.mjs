/**
 * Records raw demo clips for the Remotion composition.
 * Outputs WebM files to demo/public/:
 *   copy.webm      - copy action, popup appears showing the new clip
 *   history.webm   - browse clipboard history, hover, click to copy
 *   search.webm    - type in search box, results filter
 *   favorites.webm - pin a clip, switch to favorites tab
 *   snippets.webm  - create snippet, show it in the list
 *   shortcut.webm  - keyboard navigation through clips
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

const TEST_CLIPS = [
  {
    content: 'Design review: increase contrast on sidebar nav elements',
    sourceTitle: 'Figma',
    sourceUrl: 'https://figma.com',
    timeOffset: 3 * 86400000,
  },
  {
    content: 'https://docs.google.com/spreadsheets/d/1abc123/edit',
    sourceTitle: 'Gmail',
    sourceUrl: 'https://mail.google.com',
    timeOffset: 2 * 86400000 + 4 * 3600000,
  },
  {
    content: 'Database migration completed with zero downtime',
    sourceTitle: 'Slack',
    sourceUrl: 'https://app.slack.com',
    timeOffset: 86400000 + 2 * 3600000,
  },
  {
    content: 'Remember to pick up groceries: eggs, milk, bread, avocados',
    sourceTitle: 'Google Keep',
    sourceUrl: 'https://keep.google.com',
    timeOffset: 22 * 3600000,
  },
  {
    content: 'Meeting notes: ship the MVP by end of sprint',
    sourceTitle: 'Notion',
    sourceUrl: 'https://notion.so',
    timeOffset: 8 * 3600000,
  },
  {
    content: '{"name":"Clippy","version":"1.0.0","description":"Clipboard manager"}',
    sourceTitle: 'GitHub',
    sourceUrl: 'https://github.com',
    timeOffset: 4 * 3600000,
  },
  {
    content: "const greet = (name) => `Hello, ${name}!`;\nconsole.log(greet('Clippy'));",
    sourceTitle: 'GitHub',
    sourceUrl: 'https://github.com',
    timeOffset: 2 * 3600000,
  },
  {
    content: 'contact@example.com',
    sourceTitle: 'Mail',
    sourceUrl: 'https://mail.example.com',
    timeOffset: 22 * 60000,
  },
  {
    content: 'https://github.com/example/project',
    sourceTitle: 'GitHub',
    sourceUrl: 'https://github.com',
    timeOffset: 8 * 60000,
  },
  {
    content: 'The quick brown fox jumps over the lazy dog',
    sourceTitle: 'Example',
    sourceUrl: 'https://example.com',
    timeOffset: 2 * 60000,
  },
];

async function waitForPopup(page) {
  // Wait for at least the search input to be visible
  await page.waitForSelector('#search', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(300);
}

async function seedOnce(page) {
  // Clear existing clips then insert fresh test data
  await page.evaluate(async (clips) => {
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

        // Clear all existing data
        const clearTx = db.transaction('clips', 'readwrite');
        clearTx.objectStore('clips').clear();
        await new Promise((r) => { clearTx.oncomplete = r; clearTx.onerror = r; });

        // Insert fresh clips
        const tx = db.transaction('clips', 'readwrite');
        const store = tx.objectStore('clips');
        for (const { content, sourceTitle, sourceUrl, timeOffset } of clips) {
          const enc = new TextEncoder();
          const buf = await crypto.subtle.digest('SHA-256', enc.encode(content));
          const hash = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
          let type = 'text';
          if (/^https?:\/\/[^\s]+$/.test(content.trim())) type = 'url';
          else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(content.trim())) type = 'email';
          else if (/^\s*[\[{]/.test(content.trim())) { try { JSON.parse(content); type = 'json'; } catch {} }
          else if (/\b(const|function|return|def|import)\b/.test(content) && content.includes('\n')) type = 'code';
          store.put({ id: crypto.randomUUID(), content, type, sourceTitle, sourceUrl, timestamp: now - timeOffset, pinned: 0, isSnippet: 0, hash, charCount: content.length });
        }
        tx.oncomplete = () => { db.close(); resolve(null); };
        tx.onerror = () => { db.close(); reject(new Error(String(tx.error))); };
      };
      req.onerror = () => reject(new Error(String(req.error)));
    });
  }, TEST_CLIPS);
}

async function openFreshPopup(context, extensionId) {
  const page = await context.newPage();
  await page.setViewportSize({ width: 380, height: 500 });
  await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`);
  await waitForPopup(page);
  return page;
}

async function saveClip(page, name) {
  const video = page.video();
  await page.close();
  if (video) {
    const dest = path.join(publicDir, `${name}.webm`);
    await video.saveAs(dest);
    console.log(`Saved: ${dest}`);
  } else {
    console.warn(`No video for ${name}`);
  }
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

  // Seed data once in a setup page, then close it (no video saved)
  const setup = await openFreshPopup(context, extensionId);
  await seedOnce(setup);
  await setup.close();
  console.log('Data seeded.');

  // ── copy ──────────────────────────────────────────────────────────────────
  {
    const page = await openFreshPopup(context, extensionId);
    // Show the full list
    await page.waitForTimeout(500);
    // Hover the top clip
    const top = page.locator('.clip-item').first();
    if (await top.count() > 0) {
      await top.hover();
      await page.waitForTimeout(400);
    }
    // Scroll gently to reveal more
    await page.mouse.wheel(0, 60);
    await page.waitForTimeout(400);
    await page.mouse.wheel(0, 60);
    await page.waitForTimeout(600);
    // Back to top
    await page.mouse.wheel(0, -200);
    await page.waitForTimeout(400);
    await saveClip(page, 'copy');
  }

  // ── history ───────────────────────────────────────────────────────────────
  {
    const page = await openFreshPopup(context, extensionId);
    await page.waitForTimeout(300);
    const clips = page.locator('.clip-item');
    const n = Math.min(await clips.count(), 6);
    for (let i = 0; i < n; i++) {
      await clips.nth(i).hover();
      await page.waitForTimeout(300);
    }
    // Click the copy button on first clip
    await clips.first().hover();
    await page.waitForTimeout(150);
    const btn = clips.first().locator('button').first();
    await btn.click();
    await page.waitForTimeout(700);
    await saveClip(page, 'history');
  }

  // ── search ────────────────────────────────────────────────────────────────
  {
    const page = await openFreshPopup(context, extensionId);
    await page.waitForTimeout(300);
    const search = page.locator('#search');
    await search.click();
    await page.waitForTimeout(150);
    for (const ch of 'github') { await page.keyboard.type(ch); await page.waitForTimeout(110); }
    await page.waitForTimeout(700);
    await search.selectText();
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(200);
    for (const ch of 'meeting') { await page.keyboard.type(ch); await page.waitForTimeout(100); }
    await page.waitForTimeout(700);
    await search.selectText();
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(400);
    await saveClip(page, 'search');
  }

  // ── favorites ─────────────────────────────────────────────────────────────
  {
    const page = await openFreshPopup(context, extensionId);
    await page.waitForTimeout(300);
    const firstClip = page.locator('.clip-item').first();
    await firstClip.hover();
    await page.waitForTimeout(250);
    // Find pin button (title contains "in" for "Pin"/"Unpin")
    const pinBtn = firstClip.locator('button[title*="in"]').first();
    if (await pinBtn.count() > 0) {
      await pinBtn.click();
      await page.waitForTimeout(400);
    }
    // Also pin second clip
    const secondClip = page.locator('.clip-item').nth(1);
    await secondClip.hover();
    await page.waitForTimeout(200);
    const pinBtn2 = secondClip.locator('button[title*="in"]').first();
    if (await pinBtn2.count() > 0) {
      await pinBtn2.click();
      await page.waitForTimeout(400);
    }
    // Switch to favorites tab
    await page.locator('button[data-tab="favorites"]').click();
    await page.waitForTimeout(600);
    // Hover pinned items
    const favItems = page.locator('.clip-item');
    const fc = await favItems.count();
    for (let i = 0; i < fc; i++) {
      await favItems.nth(i).hover();
      await page.waitForTimeout(350);
    }
    await saveClip(page, 'favorites');
  }

  // ── snippets ──────────────────────────────────────────────────────────────
  {
    const page = await openFreshPopup(context, extensionId);
    await page.waitForTimeout(300);
    // Go to snippets tab
    await page.locator('button[data-tab="snippets"]').click();
    await page.waitForTimeout(400);
    // Click new snippet button
    const newBtn = page.locator('button').filter({ hasText: /new|add|\+/i }).first();
    if (await newBtn.count() > 0) {
      await newBtn.click();
      await page.waitForTimeout(400);
    }
    const textarea = page.locator('textarea').first();
    if (await textarea.count() > 0) {
      await textarea.click();
      await page.waitForTimeout(150);
      for (const ch of 'Best regards,\nThe Clippy Team') {
        await page.keyboard.type(ch);
        await page.waitForTimeout(50);
      }
      await page.waitForTimeout(300);
    }
    const shortcutInput = page.locator('input[placeholder*="shortcut" i], input[name*="shortcut" i]').first();
    if (await shortcutInput.count() > 0) {
      await shortcutInput.click();
      await page.waitForTimeout(150);
      for (const ch of ';br') { await page.keyboard.type(ch); await page.waitForTimeout(100); }
      await page.waitForTimeout(300);
    }
    const saveBtn = page.locator('button').filter({ hasText: /save/i }).first();
    if (await saveBtn.count() > 0) {
      await saveBtn.click();
      await page.waitForTimeout(700);
    }
    await saveClip(page, 'snippets');
  }

  // ── shortcut ──────────────────────────────────────────────────────────────
  {
    const page = await openFreshPopup(context, extensionId);
    await page.waitForTimeout(400);
    // Navigate with keyboard
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(200);
    }
    await page.waitForTimeout(200);
    // Go back up
    for (let i = 0; i < 2; i++) {
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(200);
    }
    await page.waitForTimeout(200);
    await page.keyboard.press('Enter');
    // Enter copies the selected clip and may close the popup; wait gracefully
    await page.waitForTimeout(300).catch(() => {});
    await saveClip(page, 'shortcut');
  }

  await context.close();
  console.log('\nDone! Run: cd demo && npm run render');
}

run().catch((err) => {
  console.error('Recording failed:', err);
  process.exit(1);
});
