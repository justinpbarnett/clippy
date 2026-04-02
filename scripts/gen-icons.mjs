/**
 * Generates extension icons at 16, 32, 48, and 128px
 * using Playwright to render the SVG source.
 *
 * Run: node scripts/gen-icons.mjs
 * (If browsers not installed: npx playwright install chromium first)
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../src/assets/icons');

function iconHtml(size) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
*{margin:0;padding:0}
html,body{width:${size}px;height:${size}px;overflow:hidden;background:transparent}
svg{display:block}
</style>
</head>
<body>
<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="100" height="100" fill="#0D0A06" rx="18"/>

  <!-- Lid, bright amber -->
  <rect x="28" y="7" width="44" height="15" rx="4" fill="#F0B050"/>

  <!-- Lid band / neck -->
  <rect x="21" y="22" width="58" height="8" rx="2" fill="#C87A38" opacity="0.85"/>

  <!-- Jar body outer -->
  <path d="M21 30 L18 77 Q18 88 50 88 Q82 88 82 77 L79 30 Z"
    fill="#C87A38" fill-opacity="0.3"
    stroke="#C87A38" stroke-width="1.5" stroke-opacity="0.6"/>

  <!-- Glass interior -->
  <path d="M26 34 L24 75 Q24 83 50 83 Q76 83 76 75 L74 34 Z"
    fill="#0D0A06" fill-opacity="0.55"/>

  <!-- Amber contents at the bottom -->
  <path d="M26 62 L24 75 Q24 83 50 83 Q76 83 76 75 L74 62 Z"
    fill="#C87A38" fill-opacity="0.28"/>

  <!-- Glass shine -->
  <line x1="32" y1="37" x2="29.5" y2="74"
    stroke="#F5C060" stroke-width="3.5" stroke-opacity="0.3" stroke-linecap="round"/>
</svg>
</body>
</html>`;
}

const SIZES = [16, 32, 48, 128];

async function run() {
  const browser = await chromium.launch();

  for (const size of SIZES) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(iconHtml(size), { waitUntil: 'networkidle' });

    const buf = await page.screenshot({
      clip: { x: 0, y: 0, width: size, height: size },
      type: 'png',
      omitBackground: false,
    });

    const out = join(OUT, `icon-${size}.png`);
    writeFileSync(out, buf);
    console.log(`icon-${size}.png`);
    await page.close();
  }

  await browser.close();
}

run().catch((err) => {
  console.error(err.message);
  if (err.message.includes('not found')) {
    console.error('\nInstall Playwright browsers first:');
    console.error('  npx playwright install chromium');
  }
  process.exit(1);
});
