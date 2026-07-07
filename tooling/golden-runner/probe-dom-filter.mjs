import { chromium } from 'playwright';

const url = 'http://localhost:8711/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('[data-testid="tool-panel-section"]');
await page.waitForTimeout(1200);

const dump = await page.evaluate(() => {
  const section = document.querySelector('.demo-page__table');
  if (!section) return { err: 'no section' };
  // find anything "filter"-ish
  const all = Array.from(section.querySelectorAll('[class*="filter"],[class*="Filter"]'));
  const uniq = new Set();
  all.forEach((el) => uniq.add(el.className));
  // is there a filter row container?
  const headerEl = section.querySelector('.cx-table-header');
  // look at the structure right under header
  const structure = {};
  const headerParent = headerEl ? headerEl.parentElement : null;
  if (headerParent) {
    structure.headerParentTag = headerParent.tagName;
    structure.headerParentClass = headerParent.className;
    structure.headerParentChildren = Array.from(headerParent.children).map((c) => ({
      tag: c.tagName,
      cls: (c.className || '').slice(0, 60),
    }));
  }
  // examine the header element's own rows
  structure.headerRows = headerEl
    ? Array.from(headerEl.children).map((c) => ({
        tag: c.tagName,
        cls: (c.className || '').slice(0, 80),
        childCount: c.children.length,
      }))
    : [];
  return { filterClasses: Array.from(uniq).slice(0, 30), structure };
});
console.log(JSON.stringify(dump, null, 2));

await browser.close();
