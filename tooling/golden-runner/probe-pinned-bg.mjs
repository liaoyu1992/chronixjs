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
    const header = section.querySelector('.cx-table-header');
    const pinnedLeft = section.querySelector('.cx-table-header-cell--pinned-left');
    const pinnedLeftLast = section.querySelector('.cx-table-header-cell--pinned-left-last');
    const pinnedRight = section.querySelector('.cx-table-header-cell--pinned-right');
    const center = section.querySelector(
      '.cx-table-row--header > .cx-table-header-cell:not(.cx-table-header-cell--pinned-left):not(.cx-table-header-cell--pinned-right)',
    );
    const bg = (el) => (el ? getComputedStyle(el).backgroundColor : null);
    // resolve the CSS var too
    const rootVar = getComputedStyle(header).getPropertyValue('--cx-table-pinned-zone-bg').trim();
    const headerBgVar = getComputedStyle(header).getPropertyValue('--cx-table-header-bg').trim();
    return {
      pinnedZoneBgVar: rootVar || '(unset)',
      headerBgVar: headerBgVar || '(unset)',
      headerBg: bg(header),
      pinnedLeftBg: bg(pinnedLeft),
      pinnedLeftLastBg: bg(pinnedLeftLast),
      pinnedRightBg: bg(pinnedRight),
      centerBg: bg(center),
    };
  });
  console.log(`${t.name}: ${JSON.stringify(data)}`);
  await page.close();
}
await browser.close();
