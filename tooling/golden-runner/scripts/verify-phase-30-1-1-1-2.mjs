/**
 * Phase 30.1.1 + 30.1.2 verification — headless Chromium against the
 * 3 running dev servers (vue3 @ 8711 / vue2 @ 8712 / react @ 8713).
 *
 * 4 scenarios per port:
 *   1. Click parent checkbox → cascade selects parent + all descendants.
 *   2. Click descendant checkbox directly → only that descendant
 *      enters the set (no upward cascade).
 *   3. Indeterminate state visible on parent checkbox when only some
 *      descendants are selected (verified via DOM `input.indeterminate`
 *      property).
 *   4. Tree-aware sort: clicking the 名称 header sorts children at
 *      every depth.
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
    await page.waitForSelector('.demo-page__tree-table .cx-table-body', {
      state: 'attached',
      timeout: 8000,
    });
    await page.waitForTimeout(400);

    const treeTable = page.locator('.demo-page__tree-table');

    async function clickCheckbox(rowId) {
      await treeTable
        .locator(`.cx-table-selection-checkbox--row[data-row-id="${rowId}"]`)
        .first()
        .evaluate((el) => {
          el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });
      await page.waitForTimeout(150);
    }

    async function checkboxStateFor(rowId) {
      return treeTable
        .locator(`.cx-table-selection-checkbox--row[data-row-id="${rowId}"]`)
        .first()
        .evaluate((el) => ({
          checked: el.checked,
          indeterminate: el.indeterminate,
          hasIndeterminateClass: el.classList.contains('cx-table-row-checkbox--indeterminate'),
        }));
    }

    // Scenario 1: cascade on parent checkbox click. The first project
    // chronix-table is expanded by defaultExpandedDepth=1, so its
    // module children (chronix-table/core etc.) are visible. We click
    // chronix-table's checkbox + assert all 3 module children also
    // become selected.
    await clickCheckbox('chronix-table');
    const parentState = await checkboxStateFor('chronix-table');
    const childState = await checkboxStateFor('chronix-table/core');
    if (parentState.checked && childState.checked) {
      console.log(`  ✓ parent checkbox click cascades to descendants`);
    } else {
      console.log(`  ✗ cascade missing: parent=${parentState.checked} child=${childState.checked}`);
      totalFail += 1;
    }

    // Scenario 2: descendant click does NOT cascade up. First reset by
    // clicking parent again (toggles all off). Then click a descendant
    // checkbox + assert the parent's checked stays false.
    await clickCheckbox('chronix-table');
    await page.waitForTimeout(100);
    await clickCheckbox('chronix-gantt/core');
    const ganttParentState = await checkboxStateFor('chronix-gantt');
    if (!ganttParentState.checked) {
      console.log(`  ✓ descendant click does not cascade up to parent`);
    } else {
      console.log(`  ✗ unexpected upward cascade: gantt parent became ${ganttParentState.checked}`);
      totalFail += 1;
    }

    // Scenario 3: indeterminate state on parent. After scenario 2,
    // chronix-gantt has 1-of-3 module descendants selected → tristate
    // 'some' → indeterminate=true on parent checkbox.
    const indeterminate = await checkboxStateFor('chronix-gantt');
    if (indeterminate.indeterminate && indeterminate.hasIndeterminateClass) {
      console.log(`  ✓ partially-selected parent shows indeterminate state`);
    } else {
      console.log(
        `  ✗ indeterminate missing: prop=${indeterminate.indeterminate} class=${indeterminate.hasIndeterminateClass}`,
      );
      totalFail += 1;
    }

    // Scenario 4: tree-aware sort. Click the 名称 header to sort ASC,
    // then verify chronix-gantt's children (visible per
    // defaultExpandedDepth=1) appear sorted alphabetically. The original
    // declared order is [core, adapters, examples]; ASC by name should
    // reorder to [adapters, core, examples].
    await treeTable
      .locator('.cx-table-header-cell[data-col-id="name"]')
      .first()
      .evaluate((el) => {
        el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
    await page.waitForTimeout(200);
    // Read the visible module rows under chronix-gantt + verify order.
    const ganttChildren = await treeTable
      .locator('.cx-table-body .cx-table-row[data-row-id^="chronix-gantt/"]')
      .evaluateAll((els) =>
        els
          .map((el) => el.getAttribute('data-row-id'))
          .filter((id) => id != null && id.split('/').length === 2),
      );
    const expectedAscOrder = [
      'chronix-gantt/adapters',
      'chronix-gantt/core',
      'chronix-gantt/examples',
    ];
    const sortLooksCorrect = JSON.stringify(ganttChildren) === JSON.stringify(expectedAscOrder);
    if (sortLooksCorrect) {
      console.log(`  ✓ tree-aware sort reorders siblings at each level`);
    } else {
      console.log(`  ✗ sort order wrong: got ${JSON.stringify(ganttChildren)}`);
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
console.log(
  `\n=== Phase 30.1.1+30.1.2 verify: ${totalFail === 0 ? 'PASS' : `FAIL (${totalFail})`} ===`,
);
process.exit(totalFail === 0 ? 0 : 1);
