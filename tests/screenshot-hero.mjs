import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extensionPath = path.resolve(__dirname, '..', 'dist');
const screenshotDir = path.resolve(__dirname, '..', 'screenshots');

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
  });

  let serviceWorker;
  if (context.serviceWorkers().length === 0) {
    serviceWorker = await context.waitForEvent('serviceworker', { timeout: 10000 });
  } else {
    serviceWorker = context.serviceWorkers()[0];
  }

  const extensionId = serviceWorker.url().split('/')[2];
  console.log('Extension ID:', extensionId);

  // Open popup and seed realistic data with varied timestamps
  const popupUrl = `chrome-extension://${extensionId}/src/popup/index.html`;
  const popupPage = await context.newPage();
  await popupPage.goto(popupUrl);
  await popupPage.waitForTimeout(1000);

  // Seed clips with realistic timestamps
  await popupPage.evaluate(async () => {
    const MINUTE = 60000;
    const HOUR = 3600000;
    const DAY = 86400000;
    const now = Date.now();

    const clips = [
      {
        content: 'Design review feedback: increase contrast on the sidebar navigation',
        sourceUrl: 'https://figma.com/design-system',
        sourceTitle: 'Figma',
        timeOffset: 3 * DAY,
      },
      {
        content: 'https://docs.google.com/spreadsheets/d/1abc123/edit',
        sourceUrl: 'https://mail.google.com',
        sourceTitle: 'Gmail',
        timeOffset: 2 * DAY + 4 * HOUR,
      },
      {
        content: 'The database migration completed successfully with zero downtime',
        sourceUrl: 'https://app.slack.com/client/T0123/C456',
        sourceTitle: 'Slack',
        timeOffset: 1 * DAY + 2 * HOUR,
      },
      {
        content: 'Remember to pick up groceries: eggs, milk, bread, avocados, coffee',
        sourceUrl: 'https://keep.google.com',
        sourceTitle: 'Google Keep',
        timeOffset: 22 * HOUR,
      },
      {
        content: 'Meeting notes from the product review: ship the MVP by end of sprint',
        sourceUrl: 'https://notion.so/meeting-notes',
        sourceTitle: 'Notion',
        timeOffset: 8 * HOUR,
      },
      {
        content: '{"name": "Clippy", "version": "1.0.0", "description": "Clipboard manager"}',
        sourceUrl: 'https://github.com/justinpbarnett/clippy/blob/main/package.json',
        sourceTitle: 'GitHub',
        timeOffset: 4 * HOUR,
      },
      {
        content: "const greeting = 'Hello, World!';\nfunction sayHello(name) {\n  return greeting.replace('World', name);\n}\nconsole.log(sayHello('Clippy'));",
        sourceUrl: 'https://github.com/justinpbarnett/clippy',
        sourceTitle: 'GitHub',
        timeOffset: 2 * HOUR + 30 * MINUTE,
      },
      {
        content: '+1 (555) 867-5309',
        sourceUrl: 'https://contacts.example.com',
        sourceTitle: 'Contacts',
        timeOffset: 45 * MINUTE,
      },
      {
        content: 'hello@example.com',
        sourceUrl: 'https://mail.example.com',
        sourceTitle: 'Mail',
        timeOffset: 22 * MINUTE,
      },
      {
        content: 'https://github.com/example/project',
        sourceUrl: 'https://github.com',
        sourceTitle: 'GitHub',
        timeOffset: 8 * MINUTE,
      },
      {
        content: 'The quick brown fox jumps over the lazy dog near the riverbank',
        sourceUrl: 'https://example.com',
        sourceTitle: 'Example',
        timeOffset: 2 * MINUTE,
      },
    ];

    // Open IndexedDB directly for full control over timestamps
    const dbReq = indexedDB.open('clippy-db', 1);
    const db = await new Promise((resolve, reject) => {
      dbReq.onsuccess = () => resolve(dbReq.result);
      dbReq.onerror = () => reject(dbReq.error);
    });

    const tx = db.transaction('clips', 'readwrite');
    const store = tx.objectStore('clips');

    for (let i = 0; i < clips.length; i++) {
      const c = clips[i];
      const content = c.content;
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(content));
      const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

      // Auto-detect type
      let type = 'text';
      if (/^https?:\/\/[^\s]+$/.test(content.trim())) type = 'url';
      else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(content.trim())) type = 'email';
      else if (/^[+]?\s*[(]?\d{1,4}[)]?[\s\-./()\d]{6,20}$/.test(content.trim())) type = 'phone';
      else if (/^\s*[[\{]/.test(content.trim())) {
        try { JSON.parse(content.trim()); type = 'json'; } catch {}
      }
      else if (/\b(const|function|return|def|import)\b/.test(content) && content.includes('\n')) type = 'code';

      const clip = {
        id: crypto.randomUUID(),
        content,
        type,
        sourceUrl: c.sourceUrl,
        sourceTitle: c.sourceTitle,
        timestamp: now - c.timeOffset,
        pinned: i === clips.length - 3 || i === clips.length - 1 ? true : false, // Pin the email and the latest
        isSnippet: false,
        hash,
        charCount: content.length,
      };

      store.put(clip);
    }

    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });

    db.close();
  });

  // Reload popup to pick up seeded data
  await popupPage.goto(popupUrl);
  await popupPage.waitForTimeout(1500);

  const clipCount = await popupPage.evaluate(() => document.querySelectorAll('.clip-item').length);
  console.log(`Clips visible: ${clipCount}`);

  // Set viewport for a tight, clean screenshot
  await popupPage.setViewportSize({ width: 420, height: 560 });
  await popupPage.waitForTimeout(500);

  // Hero screenshot: the popup
  const appEl = await popupPage.$('#app');
  if (appEl) {
    await appEl.screenshot({
      path: path.join(screenshotDir, 'clippy-hero.png'),
      type: 'png',
    });
    console.log('Saved: clippy-hero.png');
  }

  // Search screenshot
  const searchInput = await popupPage.$('#search');
  if (searchInput) {
    await searchInput.fill('github');
    await popupPage.waitForTimeout(400);
    await appEl.screenshot({
      path: path.join(screenshotDir, 'clippy-search.png'),
      type: 'png',
    });
    console.log('Saved: clippy-search.png');
    await searchInput.fill('');
    await popupPage.waitForTimeout(300);
  }

  // Favorites tab screenshot
  const favTab = await popupPage.$('button[data-tab="favorites"]');
  if (favTab) {
    await favTab.click();
    await popupPage.waitForTimeout(600);
    await appEl.screenshot({
      path: path.join(screenshotDir, 'clippy-favorites.png'),
      type: 'png',
    });
    console.log('Saved: clippy-favorites.png');
  }

  await context.close();
  console.log('Done!');
}

run().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
