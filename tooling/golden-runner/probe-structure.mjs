import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('http://localhost:8711/', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.demo-page__table', { timeout: 15000 });
await page.waitForTimeout(1000);

// Dump a compact class/role tree of the MAIN table so we know how to select rows + cells.
const tree = await page.evaluate(() => {
  const section = document.querySelectorAll('.demo-page__table')[0];
  // table root = first descendant whose class contains the table root prefix
  const all = Array.from(section.querySelectorAll('*'));
  const tableRoot =
    all.find((el) => /\bcx-table\b/.test(el.className?.toString?.() ?? '')) ?? section;
  const walk = (el, depth) => {
    if (depth > 7) return undefined;
    const cls = (el.className?.toString?.() ?? '').trim();
    const role = el.getAttribute('role');
    const label = `${el.tagName.toLowerCase()}${cls ? '.' + cls.split(' ').slice(0, 2).join('.') : ''}${role ? `[${role}]` : ''}`;
    const node = { d: depth, label };
    const kids = Array.from(el.children);
    if (kids.length && depth < 7) node.k = kids.map((c) => walk(c, depth + 1)).filter(Boolean);
    return node;
  };
  return walk(tableRoot, 0);
});

const print = (n, indent = '') => {
  if (!n) return;
  console.log(indent + n.label);
  (n.k ?? []).forEach((c) => print(c, indent + '  '));
};
print(tree);

await browser.close();
