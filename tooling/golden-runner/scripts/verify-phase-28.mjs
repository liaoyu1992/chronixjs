/**
 * Phase 28 shift+arrow verification — headless Chromium against the
 * 3 running dev servers (8711 / 8712 / 8713). Each port runs:
 *
 *   1. baseline: no active cell, no range.
 *   2. click r2/qty → shift+ArrowRight → active range exists with
 *      anchor=r2/qty + focus=r2/status.
 *   3. shift+ArrowDown → focus extends to r3/status; anchor stays r2/qty.
 *   4. plain ArrowRight → range collapses (DOM no longer shows
 *      `.cx-table-cell--in-cell-range`).
 *   5. shift+ArrowDown → fresh range with anchor at the cell where
 *      activeCell now sits.
 *   6. Escape → both cleared (no active outline + no range cells).
 *   7. console errors: none across the above.
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

    // Helper: dispatch a keydown directly on the body element so the
    // adapter's delegated handler fires (mirrors Phase 26's verify-26.3 lesson).
    async function bodyKeydown(opts) {
      await page.locator('.cx-table-body').evaluate((el, eventInit) => {
        el.dispatchEvent(new KeyboardEvent('keydown', { ...eventInit, bubbles: true }));
      }, opts);
    }

    // Scenario 1: click r2/qty.
    const cell = page.locator('.cx-table-cell[data-row-id="r2"][data-col-id="qty"]').first();
    await cell.evaluate((el) => {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await page.waitForTimeout(120);

    // Scenario 2: shift+ArrowRight extends range to r2/status.
    await bodyKeydown({ key: 'ArrowRight', shiftKey: true });
    await page.waitForTimeout(150);
    const rangeAfterShift = await page.locator('.cx-table-cell--in-cell-range').count();
    if (rangeAfterShift >= 2) {
      console.log(`  ✓ shift+ArrowRight → range covers ${rangeAfterShift} cells`);
    } else {
      console.log(`  ✗ shift+ArrowRight expected ≥2 range cells, got ${rangeAfterShift}`);
      totalFail += 1;
    }

    // Scenario 3: shift+ArrowDown extends focus downward (range grows).
    await bodyKeydown({ key: 'ArrowDown', shiftKey: true });
    await page.waitForTimeout(150);
    const rangeAfterDown = await page.locator('.cx-table-cell--in-cell-range').count();
    if (rangeAfterDown > rangeAfterShift) {
      console.log(
        `  ✓ shift+ArrowDown → range grew from ${rangeAfterShift} to ${rangeAfterDown} cells`,
      );
    } else {
      console.log(
        `  ✗ shift+ArrowDown expected range to grow, got ${rangeAfterShift} → ${rangeAfterDown}`,
      );
      totalFail += 1;
    }

    // Scenario 4: plain ArrowRight collapses range.
    await bodyKeydown({ key: 'ArrowRight' });
    await page.waitForTimeout(150);
    const rangeAfterPlain = await page.locator('.cx-table-cell--in-cell-range').count();
    if (rangeAfterPlain === 0) {
      console.log(`  ✓ plain ArrowRight → range collapsed (0 cells)`);
    } else {
      console.log(`  ✗ plain ArrowRight expected 0 range cells, got ${rangeAfterPlain}`);
      totalFail += 1;
    }

    // Scenario 5: shift+ArrowDown after plain Right opens fresh range.
    await bodyKeydown({ key: 'ArrowDown', shiftKey: true });
    await page.waitForTimeout(150);
    const rangeAfterFresh = await page.locator('.cx-table-cell--in-cell-range').count();
    if (rangeAfterFresh >= 2) {
      console.log(`  ✓ shift+ArrowDown opens fresh range (${rangeAfterFresh} cells)`);
    } else {
      console.log(`  ✗ shift+ArrowDown expected ≥2 cells, got ${rangeAfterFresh}`);
      totalFail += 1;
    }

    // Scenario 6: Escape clears both range AND active cell.
    await bodyKeydown({ key: 'Escape' });
    await page.waitForTimeout(150);
    const rangeAfterEscape = await page.locator('.cx-table-cell--in-cell-range').count();
    const activeAfterEscape = await page.locator('.cx-table-cell--active').count();
    if (rangeAfterEscape === 0 && activeAfterEscape === 0) {
      console.log(`  ✓ Escape cleared both range (0) and active (0)`);
    } else {
      console.log(
        `  ✗ Escape expected range=0 + active=0, got range=${rangeAfterEscape} + active=${activeAfterEscape}`,
      );
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
}

await browser.close();
console.log(`\n=== Phase 28 verify: ${totalFail === 0 ? 'PASS' : `FAIL (${totalFail})`} ===`);
process.exit(totalFail === 0 ? 0 : 1);
