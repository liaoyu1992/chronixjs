/**
 * Phase 30.1 tree-data verification — headless Chromium against the
 * vue3 dev server (8711). Validates the tree-column rendering +
 * chevron toggle + keyboard expand/collapse semantics in a real
 * browser (catches anything the JSDOM SFC tests miss).
 *
 * Scenarios (vue3 only at Phase 30.1; vue2 + react ship in Phase 30.2):
 *   1. Initial state: defaultExpandedDepth=1 → projects + their direct
 *      module children visible; deeper levels collapsed.
 *   2. Click chevron on first project → its child rows appear (or
 *      collapse + reappear if already expanded).
 *   3. Enter on a parent's tree-column cell toggles expand.
 *   4. ArrowRight on collapsed parent expands.
 *   5. ArrowLeft on expanded parent collapses.
 *   6. "全展开" button (calls expandRow imperatively) shows deeper rows.
 *   7. console errors: none.
 *
 * Exit 0 on green; exit 1 on any failure.
 */
import { chromium } from 'playwright';

const VUE3_PORT = 8711;

let totalFail = 0;
const browser = await chromium.launch({ headless: true });

console.log(`\n=== vue3 (port ${VUE3_PORT}) ===`);
const context = await browser.newContext({ viewport: { width: 1280, height: 2400 } });
const page = await context.newPage();
const consoleErrors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});

try {
  await page.goto(`http://localhost:${VUE3_PORT}/`, { waitUntil: 'networkidle' });

  // Wait for both tables to mount (main demo + tree demo).
  await page.waitForSelector('.demo-page__tree-table .cx-table-body', {
    state: 'attached',
    timeout: 8000,
  });
  await page.waitForTimeout(400);

  // Scope all queries to the tree table (the second .demo-page__table).
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
      .locator(`.cx-table-cell[data-col-id="name"][data-row-id="${rowId}"] .cx-table-tree-chevron`)
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

  // Scenario 1: initial state — defaultExpandedDepth=1 means each
  // project is expanded (showing its module children) but modules are
  // collapsed (no folder children visible).
  const initialIds = await treeRowIds();
  const hasProjects = initialIds.includes('chronix-table');
  const hasModule = initialIds.includes('chronix-table/core');
  const noFolder = !initialIds.includes('chronix-table/core/src');
  if (hasProjects && hasModule && noFolder) {
    console.log(`  ✓ defaultExpandedDepth=1 shows projects + modules, hides folders`);
  } else {
    console.log(
      `  ✗ defaultExpandedDepth=1 initial state wrong: projects=${hasProjects} modules=${hasModule} foldersHidden=${noFolder}`,
    );
    totalFail += 1;
  }

  // Scenario 2: click chevron on chronix-table/core to expand its
  // folder children.
  await clickChevron('chronix-table/core');
  const afterClickIds = await treeRowIds();
  if (afterClickIds.includes('chronix-table/core/src')) {
    console.log(`  ✓ chevron click expands module → folder children visible`);
  } else {
    console.log(`  ✗ chevron click did not expand chronix-table/core (no /src child)`);
    totalFail += 1;
  }

  // Scenario 3: Enter on a parent's tree-column cell toggles expand.
  // Click chronix-table/core/src cell first to set activeCell, then Enter.
  await clickCellInTree('chronix-table/core/src', 'name');
  await bodyKeydown({ key: 'Enter' });
  const afterEnterIds = await treeRowIds();
  if (afterEnterIds.includes('chronix-table/core/src/index.ts')) {
    console.log(`  ✓ Enter on parent cell expands the row`);
  } else {
    console.log(`  ✗ Enter on parent cell did not expand chronix-table/core/src`);
    totalFail += 1;
  }

  // Scenario 4: ArrowRight on a collapsed parent expands it.
  // chronix-gantt (project) is currently collapsed (we never touched
  // it). Activate its cell + press ArrowRight; chronix-gantt itself is
  // at level 0, but its chevron expands to show modules.
  // Wait — defaultExpandedDepth=1 means projects are EXPANDED. Let me
  // pick a level-1 module that's still collapsed. chronix-gantt/core
  // (or similar). Actually with defaultExpandedDepth=1, ALL projects'
  // direct module children are visible but modules are collapsed.
  // Pick a fresh module: chronix-gantt/core (module child of project).
  await clickCellInTree('chronix-gantt/core', 'name');
  await bodyKeydown({ key: 'ArrowRight' });
  const afterArrowRight = await treeRowIds();
  if (afterArrowRight.includes('chronix-gantt/core/src')) {
    console.log(`  ✓ ArrowRight on collapsed module expands it`);
  } else {
    console.log(`  ✗ ArrowRight on collapsed chronix-gantt/core did not expand (no /src child)`);
    totalFail += 1;
  }

  // Scenario 5: ArrowLeft on an expanded module collapses it.
  // chronix-gantt/core is now expanded (per scenario 4). ArrowLeft
  // should collapse it.
  await clickCellInTree('chronix-gantt/core', 'name');
  await bodyKeydown({ key: 'ArrowLeft' });
  const afterArrowLeft = await treeRowIds();
  if (!afterArrowLeft.includes('chronix-gantt/core/src')) {
    console.log(`  ✓ ArrowLeft on expanded module collapses it`);
  } else {
    console.log(`  ✗ ArrowLeft on expanded chronix-gantt/core did not collapse`);
    totalFail += 1;
  }

  // Scenario 6: "全展开" button (calls expandRow for every parent).
  await treeTable.locator('.demo-page__autosize-actions button:has-text("全展开")').first().click();
  await page.waitForTimeout(200);
  const afterExpandAll = await treeRowIds();
  // Expect to see a deep file row.
  if (afterExpandAll.includes('chronix-table/core/src/index.ts')) {
    console.log(`  ✓ 全展开 button reveals deepest file rows`);
  } else {
    console.log(`  ✗ 全展开 button did not reveal deepest file rows`);
    totalFail += 1;
  }

  // Scenario 7: console errors clean.
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

await browser.close();
console.log(`\n=== Phase 30.1 verify: ${totalFail === 0 ? 'PASS' : `FAIL (${totalFail})`} ===`);
process.exit(totalFail === 0 ? 0 : 1);
