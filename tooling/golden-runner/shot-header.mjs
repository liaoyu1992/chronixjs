import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'tmp-shots');

const targets = [
  { name: 'vue3', url: 'http://localhost:8711/' },
  { name: 'vue2', url: 'http://localhost:8712/' },
  { name: 'react', url: 'http://localhost:8713/' },
];

const browser = await chromium.launch();
for (const t of targets) {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  });
  await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForSelector('.demo-page__table', { timeout: 15000 });
  await page.waitForTimeout(1200);
  // element-level screenshot of the main table's header (group rows + leaf header row)
  await page
    .locator('.demo-page__table .cx-table-header')
    .first()
    .screenshot({ path: path.join(OUT, `${t.name}-header-area.png`) });
  // also a close-up of header + first 2 body rows for context
  const wrapper = page.locator('.demo-page__table .cx-table-wrapper').first();
  const box = await wrapper.boundingBox();
  if (box) {
    await page.screenshot({
      path: path.join(OUT, `${t.name}-header-body.png`),
      clip: { x: box.x, y: box.y, width: Math.min(box.width, 720), height: 160 },
    });
  }
  console.log(`captured ${t.name}`);
  await page.close();
}
await browser.close();
console.log('done ->', OUT);
