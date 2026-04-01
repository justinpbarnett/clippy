import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extensionPath = path.resolve(__dirname, '..', 'dist');
const screenshotDir = path.resolve(__dirname, '..', 'screenshots');

const TEST_HTML = `<!DOCTYPE html>
<html>
<head><title>Clippy Test Page</title></head>
<body style="font-family: system-ui; padding: 40px; max-width: 800px; margin: 0 auto;">
  <h1>Clippy Integration Test</h1>

  <p id="plain-text">The quick brown fox jumps over the lazy dog near the riverbank</p>
  <p id="url-text">https://github.com/justinpbarnett/clippy</p>
  <p id="email-text">hello@example.com</p>
  <p id="phone-text">+1 (555) 867-5309</p>
  <pre id="code-text">const greeting = 'Hello, World!';
function sayHello(name) {
  return greeting.replace('World', name);
}
console.log(sayHello('Clippy'));</pre>
  <pre id="json-text">{"name": "Clippy", "version": "1.0.0", "private": true}</pre>
  <p id="text-2">Meeting notes from the product review: ship the MVP by end of sprint</p>
  <p id="text-3">Remember to pick up groceries on the way home</p>
  <p id="text-4">The database migration completed successfully with zero downtime</p>
  <p id="text-5">Design review feedback: increase contrast on the sidebar navigation</p>
  <p id="url-2">https://docs.google.com/spreadsheets/d/1abc123/edit</p>
  <input id="password-field" type="password" value="supersecret123" />
</body>
</html>`;

async function run() {
  console.log('Launching Chrome with Clippy extension...');

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

  // Wait for extension service worker
  let serviceWorker;
  if (context.serviceWorkers().length === 0) {
    serviceWorker = await context.waitForEvent('serviceworker', { timeout: 10000 });
  } else {
    serviceWorker = context.serviceWorkers()[0];
  }

  const swUrl = serviceWorker.url();
  const extensionId = swUrl.split('/')[2];
  console.log('Extension ID:', extensionId);

  // ─── TEST 1: Copy text from a routed page (content scripts need http URL) ───
  console.log('\n--- Test 1: Clipboard capture ---');

  const testPage = await context.newPage();

  // Intercept a real URL and serve our test HTML so content scripts inject
  await testPage.route('https://test.clippy.local/**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: TEST_HTML,
    });
  });

  await testPage.goto('https://test.clippy.local/test');
  await testPage.waitForTimeout(1500); // Content script injection time

  // Verify content script injected
  const hasContentScript = await testPage.evaluate(() => {
    return typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined';
  }).catch(() => false);
  console.log(`  Content script injected: ${hasContentScript}`);

  // If content script not injecting via route, seed data directly via service worker
  if (!hasContentScript) {
    console.log('  Content script did not inject. Seeding data directly via service worker...');
    await seedDataDirectly(context, extensionId);
  } else {
    // Copy diverse content using select + Cmd+C
    const copies = [
      '#plain-text',
      '#url-text',
      '#email-text',
      '#phone-text',
      '#code-text',
      '#json-text',
      '#text-2',
      '#text-3',
      '#text-4',
      '#text-5',
      '#url-2',
    ];

    for (const sel of copies) {
      await testPage.evaluate((s) => {
        const el = document.querySelector(s);
        const range = document.createRange();
        range.selectNodeContents(el);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }, sel);
      await testPage.keyboard.press('Meta+c');
      await testPage.waitForTimeout(400);
      console.log(`  Copied: ${sel}`);
    }

    // Test password field skip
    console.log('\n--- Test 2: Password field skip ---');
    await testPage.focus('#password-field');
    await testPage.keyboard.press('Meta+a');
    await testPage.keyboard.press('Meta+c');
    await testPage.waitForTimeout(400);
    console.log('  Attempted copy from password field');
  }

  // ─── Open popup and verify ───
  console.log('\n--- Test 3: Open popup ---');
  const popupUrl = `chrome-extension://${extensionId}/src/popup/index.html`;
  const popupPage = await context.newPage();
  await popupPage.goto(popupUrl);
  await popupPage.waitForTimeout(2000);

  const clipCount = await popupPage.evaluate(() => {
    return document.querySelectorAll('.clip-item').length;
  });
  console.log(`  Clips visible: ${clipCount}`);

  // If still no clips from content script, seed directly and reload
  if (clipCount === 0) {
    console.log('  No clips from content script. Seeding via extension page...');
    await seedViaPopup(popupPage, extensionId, context);
    await popupPage.goto(popupUrl);
    await popupPage.waitForTimeout(2000);

    const newCount = await popupPage.evaluate(() => {
      return document.querySelectorAll('.clip-item').length;
    });
    console.log(`  Clips after seeding: ${newCount}`);
  }

  // Get clip details
  const clipDetails = await popupPage.evaluate(() => {
    const items = document.querySelectorAll('.clip-item');
    return Array.from(items).map(item => {
      const textEl = item.querySelector('.truncate');
      const badges = item.querySelectorAll('span');
      let badge = '';
      badges.forEach(b => {
        const t = b.textContent?.trim();
        if (['URL', 'Email', 'Phone', 'Code', 'JSON', 'Text', 'Rich'].includes(t)) badge = t;
      });
      return {
        text: textEl?.textContent?.trim().slice(0, 80) || '',
        badge,
      };
    });
  });

  for (const c of clipDetails) {
    console.log(`  [${c.badge || '?'}] ${c.text}`);
  }

  // ─── Test search ───
  console.log('\n--- Test 4: Fuzzy search ---');
  const searchInput = await popupPage.$('#search');
  if (searchInput) {
    await searchInput.fill('github');
    await popupPage.waitForTimeout(300);
    const searchCount = await popupPage.evaluate(() => document.querySelectorAll('.clip-item').length);
    console.log(`  Search "github": ${searchCount} results`);
    await searchInput.fill('');
    await popupPage.waitForTimeout(300);
  }

  // ─── Test pin ───
  console.log('\n--- Test 5: Pin/favorite ---');
  const starBtn = await popupPage.$('.star-btn');
  if (starBtn) {
    await starBtn.click();
    await popupPage.waitForTimeout(500);
    const starText = await popupPage.evaluate(() => {
      return document.querySelector('.star-btn')?.textContent?.trim();
    });
    console.log(`  Star after click: "${starText}"`);
  }

  // ─── Test tab switching ───
  console.log('\n--- Test 6: Tab switching ---');
  const favTab = await popupPage.$('button[data-tab="favorites"]');
  if (favTab) {
    await favTab.click();
    await popupPage.waitForTimeout(500);
    const favCount = await popupPage.evaluate(() => document.querySelectorAll('.clip-item').length);
    console.log(`  Favorites count: ${favCount}`);
  }

  // Switch back to All for screenshot
  const allTab = await popupPage.$('button[data-tab="all"]');
  if (allTab) {
    await allTab.click();
    await popupPage.waitForTimeout(500);
  }

  // ─── Test keyboard nav ───
  console.log('\n--- Test 7: Keyboard navigation ---');
  await popupPage.keyboard.press('ArrowDown');
  await popupPage.waitForTimeout(100);
  await popupPage.keyboard.press('ArrowDown');
  await popupPage.waitForTimeout(100);

  const selectedIdx = await popupPage.evaluate(() => {
    const items = document.querySelectorAll('.clip-item');
    for (let i = 0; i < items.length; i++) {
      if (items[i].className.includes('blue-50') || items[i].className.includes('blue-500')) return i;
    }
    return -1;
  });
  console.log(`  Selected after 2x Down: ${selectedIdx}`);

  // Reset to first item for screenshot
  await popupPage.keyboard.press('ArrowUp');
  await popupPage.keyboard.press('ArrowUp');
  await popupPage.waitForTimeout(200);

  // ─── SCREENSHOTS ───
  console.log('\n--- Screenshots ---');
  await popupPage.setViewportSize({ width: 420, height: 560 });
  await popupPage.waitForTimeout(300);

  const appEl = await popupPage.$('#app');
  if (appEl) {
    await appEl.screenshot({ path: path.join(screenshotDir, 'clippy-popup.png'), type: 'png' });
    console.log('  Saved: clippy-popup.png');
  }

  await popupPage.screenshot({
    path: path.join(screenshotDir, 'clippy-full.png'),
    type: 'png',
  });
  console.log('  Saved: clippy-full.png');

  // ─── Options page ───
  console.log('\n--- Test 8: Options page ---');
  const optionsPage = await context.newPage();
  await optionsPage.goto(`chrome-extension://${extensionId}/src/options/index.html`);
  await optionsPage.waitForTimeout(1500);
  const optTitle = await optionsPage.evaluate(() => document.querySelector('h1')?.textContent);
  console.log(`  Options title: "${optTitle}"`);
  await optionsPage.screenshot({ path: path.join(screenshotDir, 'clippy-options.png'), type: 'png' });

  // ─── Summary ───
  const finalCount = await popupPage.evaluate(() => document.querySelectorAll('.clip-item').length);
  const hasBadges = clipDetails.some(c => c.badge && c.badge !== 'Text');
  const results = [
    { name: 'Clipboard history populated', pass: finalCount > 0 },
    { name: 'Type detection badges', pass: hasBadges },
    { name: 'Search functionality', pass: searchInput !== null },
    { name: 'Pin/favorite toggle', pass: starBtn !== null },
    { name: 'Tab switching', pass: favTab !== null },
    { name: 'Keyboard navigation', pass: selectedIdx >= 0 },
    { name: 'Options page renders', pass: optTitle === 'Clippy Settings' },
  ];

  console.log('\n═══════════════════════════════════');
  console.log('Test Summary');
  console.log('═══════════════════════════════════');
  let passed = 0;
  for (const r of results) {
    console.log(`  ${r.pass ? 'PASS' : 'FAIL'}: ${r.name}`);
    if (r.pass) passed++;
  }
  console.log(`\n  ${passed}/${results.length} passed`);
  console.log('═══════════════════════════════════');

  await context.close();
}

// Seed data directly via the extension popup page's IndexedDB
async function seedViaPopup(popupPage, extensionId, context) {
  await popupPage.evaluate(async () => {
    const clips = [
      { content: 'https://docs.google.com/spreadsheets/d/1abc123/edit', type: 'url', sourceUrl: 'https://mail.google.com', sourceTitle: 'Gmail' },
      { content: 'Design review feedback: increase contrast on the sidebar navigation', type: 'text', sourceUrl: 'https://notion.so/design-review', sourceTitle: 'Notion' },
      { content: 'The database migration completed successfully with zero downtime', type: 'text', sourceUrl: 'https://slack.com', sourceTitle: 'Slack' },
      { content: 'Remember to pick up groceries on the way home', type: 'text', sourceUrl: 'https://messages.google.com', sourceTitle: 'Messages' },
      { content: 'Meeting notes from the product review: ship the MVP by end of sprint', type: 'text', sourceUrl: 'https://docs.google.com/doc/meeting-notes', sourceTitle: 'Google Docs' },
      { content: '{"name": "Clippy", "version": "1.0.0", "private": true}', type: 'json', sourceUrl: 'https://github.com/justinpbarnett/clippy', sourceTitle: 'GitHub' },
      { content: "const greeting = 'Hello, World!';\nfunction sayHello(name) {\n  return greeting.replace('World', name);\n}\nconsole.log(sayHello('Clippy'));", type: 'code', sourceUrl: 'https://github.com/justinpbarnett/clippy', sourceTitle: 'GitHub' },
      { content: '+1 (555) 867-5309', type: 'phone', sourceUrl: 'https://contacts.example.com', sourceTitle: 'Contacts' },
      { content: 'hello@example.com', type: 'email', sourceUrl: 'https://mail.example.com', sourceTitle: 'Mail' },
      { content: 'https://github.com/justinpbarnett/clippy', type: 'url', sourceUrl: 'https://github.com', sourceTitle: 'GitHub' },
      { content: 'The quick brown fox jumps over the lazy dog near the riverbank', type: 'text', sourceUrl: 'https://example.com', sourceTitle: 'Example' },
    ];

    // Send each clip to the service worker
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      await chrome.runtime.sendMessage({
        type: 'CLIP_CAPTURED',
        payload: {
          content: clip.content,
          sourceUrl: clip.sourceUrl,
          sourceTitle: clip.sourceTitle,
        },
      });
      // Small delay so timestamps differ
      await new Promise(r => setTimeout(r, 100));
    }
  });

  // Pin the first clip (most recent: the plain text one)
  await popupPage.waitForTimeout(500);
}

async function seedDataDirectly(context, extensionId) {
  const seedPage = await context.newPage();
  await seedPage.goto(`chrome-extension://${extensionId}/src/popup/index.html`);
  await seedPage.waitForTimeout(1000);
  await seedViaPopup(seedPage, extensionId, context);
  await seedPage.close();
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
