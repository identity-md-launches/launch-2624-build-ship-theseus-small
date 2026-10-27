import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { loadPlaywright } from './modules.mjs';

const { chromium } = await loadPlaywright();
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  const svg = await readFile(new URL('../src/assets/share.svg', import.meta.url), 'utf8');
  await page.goto('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
  await page.screenshot({ path: fileURLToPath(new URL('../src/assets/share.png', import.meta.url)) });
  console.log('Rebuilt src/assets/share.png (1200 × 630). Run npm run build to export it.');
} finally {
  await browser.close();
}
