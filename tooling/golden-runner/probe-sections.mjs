import { chromium } from 'playwright';

const targets = [
  { name: 'vue3', url: 'http://localhost:8711/' },
  { name: 'vue2', url: 'http://localhost:8712/' },
];

const browser = await chromium.launch();
const out = {};
for (const t of targets) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForSelector('.demo-page__table', { timeout: 15000 });
  await page.waitForTimeout(1500);

  out[t.name] = await page.evaluate(() => {
    const qsa = (sel, root) => Array.from((root || document).querySelectorAll(sel));
    const header = document.querySelector('.demo-page__header');
    const toolbar = document.querySelector('.demo-page__autosize-actions');
    const sections = qsa('.demo-page__table', document.body);
    return {
      headerPills: qsa('[class*="pill"],[class*="state"]', header).map((e) =>
        (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 45),
      ),
      toolbarParent: toolbar ? toolbar.parentElement.className : null,
      toolbarButtons: toolbar
        ? qsa('button', toolbar).map((b) =>
            (b.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28),
          )
        : [],
      sectionCount: sections.length,
      sections: sections.map((sec, i) => {
        const heading = sec.querySelector('h2,h3');
        const firstText = (sec.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50);
        return {
          idx: i,
          heading: heading
            ? heading.textContent.trim().replace(/\s+/g, ' ').slice(0, 60)
            : '(no h2)',
          buttonCount: qsa('button', sec).length,
          buttonLabels: qsa('button', sec).map((b) =>
            (b.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 20),
          ),
          inputCount: qsa('input', sec).length,
          bodyRows: qsa('tbody tr,[role="row"]', sec).length,
          hasChronixTable: !!sec.querySelector('[class*="cx-table"]'),
          firstText,
        };
      }),
    };
  });
  await page.close();
}
await browser.close();

for (const name of Object.keys(out)) {
  const d = out[name];
  console.log(`\n========== ${name} ==========`);
  console.log(`headerPills(${d.headerPills.length}):`);
  d.headerPills.forEach((p) => console.log(`   - ${p}`));
  console.log(`toolbar parent: ${d.toolbarParent}, buttons: ${d.toolbarButtons.length}`);
  console.log(`sections(${d.sectionCount}):`);
  d.sections.forEach((s) => {
    console.log(
      `  [${s.idx}] "${s.heading}" rows=${s.bodyRows} btns=${s.buttonCount} inputs=${s.inputCount} cxTable=${s.hasChronixTable}`,
    );
    if (s.buttonCount > 0) console.log(`        buttons: ${JSON.stringify(s.buttonLabels)}`);
  });
}
