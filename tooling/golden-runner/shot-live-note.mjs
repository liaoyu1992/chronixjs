import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
});
await page.goto('http://localhost:8711/', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('[data-testid="tool-panel-section"]');
await page.waitForTimeout(1500);

// screenshot the main table region (header + filter + first body rows)
const main = await page.$('.demo-page__table .cx-table-wrapper');
if (main) {
  await main.screenshot({ path: 'tmp-shots/live-vue3-main.png' });
  console.log('saved live-vue3-main.png');
}

// also a tight crop of the note column (pinned right) — header+filter+body
const box = await main.boundingBox();
// the note column is the rightmost ~180px; crop right 220px, top 320px
const crop = {
  x: box.x + box.width - 230,
  y: box.y,
  width: 230,
  height: 360,
};
await page.screenshot({ path: 'tmp-shots/live-vue3-note-col.png', clip: crop });
console.log('saved live-vue3-note-col.png', JSON.stringify(crop));

await browser.close();
