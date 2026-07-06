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
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  });
  await page.goto(t.url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="tool-panel-section"]');
  await page.waitForTimeout(1500);
  // scroll the tool-panel body to 0
  await page.evaluate(() => {
    const b = document.querySelector('[data-testid="tool-panel-section"] .cx-table-body');
    if (b) b.scrollLeft = 0;
  });
  await page.waitForTimeout(500);
  const box = await page.locator('[data-testid="tool-panel-section"]').first().boundingBox();
  if (box) {
    await page.screenshot({
      path: path.join(OUT, `${t.name}-toolpanel.png`),
      clip: { x: box.x, y: box.y, width: box.width, height: Math.min(box.height, 460) },
    });
    console.log(
      `shot -> ${t.name}-toolpanel.png  (${Math.round(box.width)}x${Math.min(Math.round(box.height), 460)})`,
    );
  }
  await page.close();
}
await browser.close();
