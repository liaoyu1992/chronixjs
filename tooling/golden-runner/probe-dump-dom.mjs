import { chromium } from 'playwright';

const targets = [
  { name: 'vue3', url: 'http://localhost:8711/' },
  { name: 'vue2', url: 'http://localhost:8712/' },
];

const browser = await chromium.launch();
const dumps = {};
for (const t of targets) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForSelector('.demo-page__table', { timeout: 15000 });
  await page.waitForTimeout(1500);

  dumps[t.name] = await page.evaluate(() => {
    const first = document.querySelector('.demo-page__table');
    if (!first) return { err: 'no .demo-page__table' };
    const qsa = (sel, root = first) => Array.from(root.querySelectorAll(sel));
    // Header area: pills/state labels sit in the demo page header above the table.
    const header = document.querySelector('.demo-page__header, header, .demo-page__toolbar');
    const pills = qsa('[class*="pill"],[class*="state"]', document.body).map((e) =>
      (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60),
    );
    const buttons = qsa('button', first).map((b) =>
      (b.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40),
    );
    // Table internals
    const tableRoot = first.querySelector('[class*="cx-table"]');
    const ths = qsa('th,[role="columnheader"],[class*="header-cell"]', first).map((e) =>
      (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30),
    );
    const rows = qsa('tbody tr,[class*="row"][class*="body"],[role="row"]', first).length;
    const footer = qsa('tfoot td,[class*="footer"],[class*="summary"],[class*="aggregat"]', first)
      .map((e) => (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40))
      .filter(Boolean);
    const pager = qsa('[class*="pag"],[class*="pager"]', first)
      .map((e) => (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40))
      .filter(Boolean);
    return {
      sectionText: (first.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 400),
      pillsCount: pills.length,
      pills,
      buttonsCount: buttons.length,
      buttons,
      thsCount: ths.length,
      ths,
      bodyRowCount: rows,
      footer,
      pager,
      tableRootClass: tableRoot ? tableRoot.className : null,
      autosizeActions: (() => {
        const el = document.querySelector('.demo-page__autosize-actions');
        if (!el) return null;
        return {
          parentClass: el.parentElement ? el.parentElement.className : null,
          buttonCount: el.querySelectorAll('button').length,
          visible: el.offsetParent !== null,
          clientHeight: el.clientHeight,
          buttons: Array.from(el.querySelectorAll('button')).map((b) =>
            (b.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30),
          ),
        };
      })(),
      bodyButtonTotal: document.body.querySelectorAll('button').length,
    };
  });
  await page.close();
}
await browser.close();

for (const name of Object.keys(dumps)) {
  console.log(`\n========== ${name} ==========`);
  console.log(JSON.stringify(dumps[name], null, 2));
}
