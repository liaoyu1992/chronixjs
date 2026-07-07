import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'tmp-shots');

const targets = [
  { name: 'vue3', url: 'http://localhost:8711/' },
  { name: 'vue2', url: 'http://localhost:8712/' },
];

const browser = await chromium.launch();
for (const t of targets) {
  // match the user's likely full-window view
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(t.url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="tool-panel-section"]');
  await page.waitForTimeout(1500);
  // full-page screenshot so we can see the main table in context
  await page.screenshot({ path: path.join(OUT, `${t.name}-full.png`), fullPage: true });
  console.log(`shot -> ${t.name}-full.png`);
  await page.close();
}
await browser.close();
