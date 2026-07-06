import { chromium } from 'playwright';

const targets = [
  { name: 'vue3', url: 'http://localhost:8711/' },
  { name: 'vue2', url: 'http://localhost:8712/' },
  { name: 'react', url: 'http://localhost:8713/' },
];
const browser = await chromium.launch();
for (const t of targets) {
  const page = await browser.newPage();
  await page.goto(t.url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.demo-page__table');
  await page.waitForTimeout(1200);
  const data = await page.evaluate(() => {
    const section = document.querySelector('.demo-page__table');
    const groupCell = section.querySelector('.cx-table-header-group');
    const leafCell = section.querySelector('.cx-table-header-cell');
    const cs = (el) => {
      const s = getComputedStyle(el);
      return {
        boxSizing: s.boxSizing,
        width: s.width,
        paddingLeft: s.paddingLeft,
        paddingRight: s.paddingRight,
        borderRightWidth: s.borderRightWidth,
        flexShrink: s.flexShrink,
      };
    };
    return {
      groupCell: groupCell ? cs(groupCell) : null,
      leafCell: leafCell ? cs(leafCell) : null,
    };
  });
  console.log(`${t.name}: ${JSON.stringify(data)}`);
  await page.close();
}
await browser.close();
