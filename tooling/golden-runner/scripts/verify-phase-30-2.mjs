/**
 * Phase 30.2 tree-data verification — headless Chromium against the
 * 3 running dev servers (vue3 @ 8711 / vue2 @ 8712 / react @ 8713).
 *
 * Scenarios per port (5; same shape as Phase 30.1 minus 2 vue3-only
 * cases — the controlled-mode + filter-auto-expand scenarios stay
 * JSDOM-only since they're not framework-specific surfaces):
 *   1. Initial state: defaultExpandedDepth=1 → projects + their direct
 *      module children visible; deeper levels collapsed.
 *   2. Click chevron on a module → its folder children appear.
 *   3. Enter on a parent's tree-column cell toggles expand.
 *   4. ArrowRight on collapsed parent expands.
 *   5. "全展开" button (calls expandRow imperatively) shows deeper rows.
 *   + 0 console errors per port.
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

    // Wait for the tree demo section to mount (2nd table on each page).
    await page.waitForSelector('.demo-page__tree-table .cx-table-body', {
      state: 'attached',
      timeout: 8000,
    });
    await page.waitForTimeout(400);

    const treeTable = page.locator('.demo-page__tree-table');

    async function treeRowIds() {
      const cells = await treeTable.locator('.cx-table-body .cx-table-row').all();
      const ids = [];
      for (const cell of cells) {
        const id = await cell.getAttribute('data-row-id');
        if (id != null) ids.push(id);
      }
      return ids;
    }

    async function clickChevron(rowId) {
      await treeTable
        .locator(
          `.cx-table-cell[data-col-id="name"][data-row-id="${rowId}"] .cx-table-tree-chevron`,
        )
        .first()
        .evaluate((el) => {
          el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });
      await page.waitForTimeout(150);
    }

    async function clickCellInTree(rowId, colId) {
      await treeTable
        .locator(`.cx-table-cell[data-row-id="${rowId}"][data-col-id="${colId}"]`)
        .first()
        .evaluate((el) => {
          el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });
      await page.waitForTimeout(100);
    }

    async function bodyKeydown(opts) {
      await treeTable.locator('.cx-table-body').evaluate((el, eventInit) => {
        el.dispatchEvent(new KeyboardEvent('keydown', { ...eventInit, bubbles: true }));
      }, opts);
      await page.waitForTimeout(150);
    }

    // Scenario 1: initial state — defaultExpandedDepth=1.
    const initialIds = await treeRowIds();
    const hasProjects = initialIds.includes('chronix-table');
    const hasModule = initialIds.includes('chronix-table/core');
    const noFolder = !initialIds.includes('chronix-table/core/src');
    if (hasProjects && hasModule && noFolder) {
      console.log(`  ✓ defaultExpandedDepth=1 shows projects + modules, hides folders`);
    } else {
      console.log(
        `  ✗ initial state wrong: projects=${hasProjects} modules=${hasModule} foldersHidden=${noFolder}`,
      );
      totalFail += 1;
    }

    // Scenario 2: chevron click expands a module.
    await clickChevron('chronix-table/core');
    const afterClickIds = await treeRowIds();
    if (afterClickIds.includes('chronix-table/core/src')) {
      console.log(`  ✓ chevron click expands module → folder children visible`);
    } else {
      console.log(`  ✗ chevron click did not expand chronix-table/core`);
      totalFail += 1;
    }

    // Scenario 3: Enter on a parent's tree-column cell toggles.
    await clickCellInTree('chronix-table/core/src', 'name');
    await bodyKeydown({ key: 'Enter' });
    const afterEnterIds = await treeRowIds();
    if (afterEnterIds.includes('chronix-table/core/src/index.ts')) {
      console.log(`  ✓ Enter on parent cell expands the row`);
    } else {
      console.log(`  ✗ Enter on parent cell did not expand chronix-table/core/src`);
      totalFail += 1;
    }

    // Scenario 4: ArrowRight on a collapsed module expands it.
    await clickCellInTree('chronix-gantt/core', 'name');
    await bodyKeydown({ key: 'ArrowRight' });
    const afterArrowRight = await treeRowIds();
    if (afterArrowRight.includes('chronix-gantt/core/src')) {
      console.log(`  ✓ ArrowRight on collapsed module expands it`);
    } else {
      console.log(`  ✗ ArrowRight on collapsed chronix-gantt/core did not expand`);
      totalFail += 1;
    }

    // Scenario 5: 全展开 button reveals deepest file rows.
    await treeTable
      .locator('.demo-page__autosize-actions button:has-text("全展开")')
      .first()
      .click();
    await page.waitForTimeout(200);
    const afterExpandAll = await treeRowIds();
    if (afterExpandAll.includes('chronix-table/core/src/index.ts')) {
      console.log(`  ✓ 全展开 button reveals deepest file rows`);
    } else {
      console.log(`  ✗ 全展开 button did not reveal deepest file rows`);
      totalFail += 1;
    }

    // Console errors clean.
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
console.log(`\n=== Phase 30.2 verify: ${totalFail === 0 ? 'PASS' : `FAIL (${totalFail})`} ===`);
process.exit(totalFail === 0 ? 0 : 1);
