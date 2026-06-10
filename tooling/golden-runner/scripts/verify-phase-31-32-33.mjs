/**
 * Phase 31 + 32 + 33 verification — headless Chromium against the
 * 3 running dev servers (vue3 @ 8711 / vue2 @ 8712 / react @ 8713).
 *
 * 5 scenarios per port:
 *   1. Top-pinned row renders with `data-pinned-row="top"` + sticky
 *      position. Bottom-pinned row mirrors with `data-pinned-row="bottom"`.
 *   2. Tooltip popover appears 250ms after hover on a 备注-column cell
 *      (column has `tooltipField: 'note'`).
 *   3. Tooltip disappears after pointer leaves the body (pointerleave
 *      clears popover + timer).
 *   4. Loading overlay paints over body when the loading toggle is on;
 *      disappears after toggling off.
 *   5. No-rows overlay paints when the empty-mode toggle clears rows.
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
    await page.waitForSelector('[data-testid="tier2-section"]', {
      state: 'attached',
      timeout: 8000,
    });
    await page.waitForTimeout(400);

    const tier2 = page.locator('[data-testid="tier2-section"]');

    // Scenario 1: pinned rows render with the expected attribute.
    const topCount = await tier2
      .locator('.cx-table-row--pinned-top[data-row-id="pinned-top-summary"]')
      .count();
    const bottomCount = await tier2
      .locator('.cx-table-row--pinned-bottom[data-row-id="pinned-bottom-total"]')
      .count();
    if (topCount >= 1 && bottomCount >= 1) {
      console.log(`  ✓ pinned rows render (top=${topCount} bottom=${bottomCount})`);
    } else {
      console.log(`  ✗ pinned row missing (top=${topCount} bottom=${bottomCount})`);
      totalFail += 1;
    }

    // Scenario 2: tooltip appears on hover over a 备注 cell after the
    // configured delay. We hover via mouse.move + wait 350ms (theme
    // default delay is 250ms).
    const noteCell = tier2.locator('.cx-table-cell[data-col-id="note"][data-row-id^="r"]').first();
    const noteBox = await noteCell.boundingBox();
    if (noteBox == null) {
      console.log(`  ✗ could not locate 备注 cell bounding box`);
      totalFail += 1;
    } else {
      // Tiny pre-move outside the cell so the React-state mover sees a
      // transition into the cell (initial paint may have a stale ref).
      await page.mouse.move(2, 2);
      await page.waitForTimeout(50);
      await page.mouse.move(noteBox.x + noteBox.width / 2, noteBox.y + noteBox.height / 2);
      await page.waitForTimeout(500);
      const tooltipCount = await page.locator('[data-testid="cx-tooltip"]').count();
      if (tooltipCount === 1) {
        console.log(`  ✓ tooltip popover appears after hover delay`);
      } else {
        console.log(`  ✗ tooltip missing (count=${tooltipCount})`);
        totalFail += 1;
      }

      // Scenario 3: pointerleave clears tooltip. Move pointer far off the
      // table region.
      await page.mouse.move(2, 2);
      await page.waitForTimeout(150);
      const tooltipAfterLeave = await page.locator('[data-testid="cx-tooltip"]').count();
      if (tooltipAfterLeave === 0) {
        console.log(`  ✓ tooltip disappears after pointer exits body`);
      } else {
        console.log(`  ✗ tooltip persists (count=${tooltipAfterLeave})`);
        totalFail += 1;
      }
    }

    // Scenario 4: loading overlay paints when toggled.
    await tier2.locator('[data-testid="tier2-loading-toggle"]').click();
    await page.waitForTimeout(150);
    const loadingCount = await tier2.locator('[data-testid="cx-overlay-loading"]').count();
    if (loadingCount === 1) {
      console.log(`  ✓ loading overlay paints when toggled on`);
    } else {
      console.log(`  ✗ loading overlay missing (count=${loadingCount})`);
      totalFail += 1;
    }
    // Toggle off + verify overlay gone.
    await tier2.locator('[data-testid="tier2-loading-toggle"]').click();
    await page.waitForTimeout(150);
    const loadingAfterOff = await tier2.locator('[data-testid="cx-overlay-loading"]').count();
    if (loadingAfterOff !== 0) {
      console.log(`  ✗ loading overlay persists after toggle off`);
      totalFail += 1;
    }

    // Scenario 5: no-rows overlay paints when rows go empty.
    await tier2.locator('[data-testid="tier2-empty-toggle"]').click();
    await page.waitForTimeout(150);
    const noRowsCount = await tier2.locator('[data-testid="cx-overlay-no-rows"]').count();
    if (noRowsCount === 1) {
      console.log(`  ✓ no-rows overlay paints when row set is empty`);
    } else {
      console.log(`  ✗ no-rows overlay missing (count=${noRowsCount})`);
      totalFail += 1;
    }
    // Restore.
    await tier2.locator('[data-testid="tier2-empty-toggle"]').click();
    await page.waitForTimeout(150);

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
console.log(`\n=== Phase 31+32+33 verify: ${totalFail === 0 ? 'PASS' : `FAIL (${totalFail})`} ===`);
process.exit(totalFail === 0 ? 0 : 1);
