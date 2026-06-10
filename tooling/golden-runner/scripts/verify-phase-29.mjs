/**
 * Phase 29 Ctrl+Arrow data-region jumps verification — headless
 * Chromium against the 3 running dev servers (8711 / 8712 / 8713).
 *
 * Each port runs:
 *   1. setActiveCell r1/qty → Ctrl+ArrowDown → activeCell should be at
 *      LAST filled row of qty column (all 50 demo rows have qty filled,
 *      so boundary = r50/qty).
 *   2. Ctrl+ArrowRight from r1/id → activeCell jumps to LAST filled
 *      column in r1 (all demo columns filled in r1, so boundary = note).
 *   3. setActiveCell r50/qty → Ctrl+ArrowUp → activeCell jumps back to
 *      r1/qty (last filled walking up).
 *   4. setActiveCell r1/qty + Ctrl+Shift+ArrowDown → cellRange extends
 *      from r1 anchor to r50/qty boundary (range covers many cells).
 *   5. console errors: none.
 *
 * Exit 0 on green; exit 1 on any failure.
 */
import { chromium } from 'playwright';

const ports = [
  { name: 'vue3', port: 8711 },
  { name: 'vue2', port: 8712 },
  { name: 'react', port: 8713 },
];

let totalFail = 0;
const browser = await chromium.launch({ headless: true });

for (const { name, port } of ports) {
  console.log(`\n=== ${name} (port ${port}) ===`);
  const context = await browser.newContext({ viewport: { width: 1280, height: 2400 } });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  try {
    await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.cx-table-body', { state: 'attached', timeout: 8000 });
    await page.waitForTimeout(400);

    async function bodyKeydown(opts) {
      await page.locator('.cx-table-body').evaluate((el, eventInit) => {
        el.dispatchEvent(new KeyboardEvent('keydown', { ...eventInit, bubbles: true }));
      }, opts);
    }

    // Helper: scroll body to top so virtualized rows re-render r1.
    async function scrollBodyToTop() {
      await page.locator('.cx-table-body').evaluate((el) => {
        el.scrollTop = 0;
      });
      await page.waitForTimeout(100);
    }

    // Helper: click a specific cell to seed activeCell. Scrolls to top
    // first so virtualization renders the target cell.
    async function clickCell(rowId, colId) {
      await scrollBodyToTop();
      await page
        .locator(`.cx-table-cell[data-row-id="${rowId}"][data-col-id="${colId}"]`)
        .first()
        .evaluate((el) => {
          el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });
      await page.waitForTimeout(120);
    }

    // Helper: read the currently-active cell's data attrs.
    async function readActiveCell() {
      const cells = await page.locator('.cx-table-cell--active').all();
      if (cells.length === 0) return null;
      const cell = cells[0];
      return {
        rowId: await cell.getAttribute('data-row-id'),
        colId: await cell.getAttribute('data-col-id'),
      };
    }

    // Scenario 1: Ctrl+ArrowDown from r1/qty jumps to last filled row.
    // The demo has 50 rows; qty is always filled. Pagination defaults to
    // 20 rows per page, so the LAST DISPLAYED row on page 1 is r20.
    // findDataRegionBoundary operates on pagedRows, so boundary = r20/qty.
    await clickCell('r1', 'qty');
    await bodyKeydown({ key: 'ArrowDown', ctrlKey: true });
    await page.waitForTimeout(150);
    let active = await readActiveCell();
    if (active?.rowId === 'r20' && active?.colId === 'qty') {
      console.log(`  ✓ Ctrl+ArrowDown from r1/qty → ${active.rowId}/${active.colId}`);
    } else {
      console.log(
        `  ✗ Ctrl+ArrowDown from r1/qty expected r20/qty, got ${active?.rowId}/${active?.colId}`,
      );
      totalFail += 1;
    }

    // Scenario 2: Ctrl+ArrowRight from r1/id jumps to last filled column.
    // All demo columns are filled for r1, so boundary = last visible col.
    // vue3 + vue2 demos pin `note` right + `id`+`name` left so visible
    // order is id → name → qty → price → status → note → note is last.
    await clickCell('r1', 'id');
    await bodyKeydown({ key: 'ArrowRight', ctrlKey: true });
    await page.waitForTimeout(150);
    active = await readActiveCell();
    if (active?.rowId === 'r1' && active?.colId === 'note') {
      console.log(`  ✓ Ctrl+ArrowRight from r1/id → ${active.rowId}/${active.colId}`);
    } else {
      console.log(
        `  ✗ Ctrl+ArrowRight from r1/id expected r1/note, got ${active?.rowId}/${active?.colId}`,
      );
      totalFail += 1;
    }

    // Scenario 3: Ctrl+ArrowUp from r3/qty walks up to r1.
    // (Using r3 instead of r20 because r20 is past virtualized window
    // when body is small; r1-r3 are always in DOM at scrollTop=0.)
    await clickCell('r3', 'qty');
    await bodyKeydown({ key: 'ArrowUp', ctrlKey: true });
    await page.waitForTimeout(150);
    active = await readActiveCell();
    if (active?.rowId === 'r1' && active?.colId === 'qty') {
      console.log(`  ✓ Ctrl+ArrowUp from r3/qty → ${active.rowId}/${active.colId}`);
    } else {
      console.log(
        `  ✗ Ctrl+ArrowUp from r3/qty expected r1/qty, got ${active?.rowId}/${active?.colId}`,
      );
      totalFail += 1;
    }

    // Scenario 4: Ctrl+Shift+ArrowDown from r1/qty extends range to
    // r20/qty (boundary). IR range covers 20 cells; DOM only renders the
    // virtualized window (~12-15 rows for the smaller-viewport demos).
    // Threshold >= 10 confirms a substantial range was applied — SFC
    // tests separately verify the exact anchor/focus via emits.
    await clickCell('r1', 'qty');
    await bodyKeydown({ key: 'ArrowDown', ctrlKey: true, shiftKey: true });
    await page.waitForTimeout(150);
    const rangeCells = await page.locator('.cx-table-cell--in-cell-range').count();
    if (rangeCells >= 10) {
      console.log(`  ✓ Ctrl+Shift+ArrowDown extended range — ${rangeCells} cells in DOM (>= 10)`);
    } else {
      console.log(`  ✗ Ctrl+Shift+ArrowDown expected range >= 10 cells, got ${rangeCells}`);
      totalFail += 1;
    }

    // Scenario 5: console errors clean.
    if (consoleErrors.length > 0) {
      console.log(`  ✗ ${consoleErrors.length} console error(s):`);
      for (const e of consoleErrors) console.log(`     ${e}`);
      totalFail += 1;
    } else {
      console.log(`  ✓ 0 console errors`);
    }
  } catch (err) {
    console.log(`  ✗ exception: ${err instanceof Error ? err.message : String(err)}`);
    totalFail += 1;
  } finally {
    await context.close();
  }
}

await browser.close();
console.log(`\n=== Phase 29 verify: ${totalFail === 0 ? 'PASS' : `FAIL (${totalFail})`} ===`);
process.exit(totalFail === 0 ? 0 : 1);
