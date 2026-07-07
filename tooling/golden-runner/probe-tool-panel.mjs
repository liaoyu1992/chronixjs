import { chromium } from 'playwright';

const targets = [
  { name: 'vue3', url: 'http://localhost:8711/' },
  { name: 'vue2', url: 'http://localhost:8712/' },
  { name: 'react', url: 'http://localhost:8713/' },
];

const GROUP_DUMP = (sel) => {
  const section = document.querySelector(sel);
  const headerEl = section?.querySelector('.cx-table-header');
  const body = section?.querySelector('.cx-table-body');
  const groups = headerEl
    ? Array.from(headerEl.querySelectorAll('.cx-table-header-group'))
        .filter((g) => (g.textContent || '').trim())
        .map((el) => ({
          text: (el.textContent || '').trim().slice(0, 8),
          left: Math.round(el.getBoundingClientRect().left),
          right: Math.round(el.getBoundingClientRect().right),
        }))
    : [];
  // also: where are the pinned-left column headers now? (the group should sit above them)
  const pinnedLeftLast = headerEl?.querySelector('.cx-table-header-cell--pinned-left-last');
  return {
    scrollLeft: body ? body.scrollLeft : null,
    pinnedLeftLastLeft: pinnedLeftLast
      ? Math.round(pinnedLeftLast.getBoundingClientRect().left)
      : null,
    groups,
  };
};

const browser = await chromium.launch();
for (const t of targets) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForSelector('[data-testid="tool-panel-section"]', { timeout: 15000 });
  await page.waitForTimeout(1200);
  console.log(`\n========== ${t.name} ==========`);
  for (const [label, sel] of [
    ['main', '.demo-page__table'],
    ['toolpanel', '[data-testid="tool-panel-section"]'],
  ]) {
    await page.evaluate((s) => {
      const b = document.querySelector(s + ' .cx-table-body');
      if (b) b.scrollLeft = 220;
    }, sel);
    await page.waitForTimeout(500);
    const d = await page.evaluate(GROUP_DUMP, sel);
    console.log(
      `[${label}] scrollLeft=${d.scrollLeft} pinnedLeftLastCol=${d.pinnedLeftLastLeft} groups=${JSON.stringify(d.groups)}`,
    );
  }
  await page.close();
}
await browser.close();
