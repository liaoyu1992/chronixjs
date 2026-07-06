import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'tmp-shots');
mkdirSync(OUT, { recursive: true });

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
  // Wait for the first table section to mount, then let layout settle.
  await page.waitForSelector('.demo-page__table', { timeout: 15000 });
  await page.waitForTimeout(1000);

  // Close-up of the main table section (header-group + filter row + body + footer + pager).
  await page
    .locator('.demo-page__table')
    .first()
    .screenshot({
      path: path.join(OUT, `${t.name}-main-table.png`),
    });

  // Full page so we can inspect the other 6 tables too.
  await page.screenshot({
    path: path.join(OUT, `${t.name}-full.png`),
    fullPage: true,
  });

  // Also capture just the table body element for the closest look at row/col alignment.
  const tableEl = page.locator('[class*="cx-table"]').first();
  if (await tableEl.count()) {
    try {
      await tableEl.screenshot({ path: path.join(OUT, `${t.name}-table-el.png`) });
    } catch {
      /* element may re-render during shot; skip */
    }
  }

  await page.close();
  console.log(`captured ${t.name}`);
}
await browser.close();
console.log('done ->', OUT);
