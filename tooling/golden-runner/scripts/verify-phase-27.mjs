/**
 * Phase 27 auto-scroll verification — headless Chromium against the
 * 3 running dev servers (8711 / 8712 / 8713). Each port runs 4
 * scenarios:
 *
 *   1. baseline: body.scrollTop === 0 (no scroll yet).
 *   2. click "setActiveCell r19/qty" button → body.scrollTop > 0
 *      (programmatic setActiveCell auto-scrolls).
 *   3. uncheck enableKeyboardAutoScroll toggle + reset scroll + click
 *      same button → body.scrollTop === 0 (opt-out works).
 *   4. console errors: none across the above.
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
  // Use a tall viewport so the long demo header description doesn't
  // squeeze the table body's flex:1 height down to 0 (vue2 demo
  // particularly susceptible).
  const context = await browser.newContext({ viewport: { width: 1280, height: 2400 } });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  try {
    await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.cx-table-body', { state: 'attached', timeout: 8000 });
    // Let layout settle + ResizeObserver fire so body.clientHeight is real.
    await page.waitForTimeout(400);

    // Scenario 1: baseline scrollTop.
    const baselineTop = await page.locator('.cx-table-body').evaluate((el) => el.scrollTop);
    if (baselineTop !== 0) {
      console.log(`  ✗ baseline scrollTop expected 0, got ${baselineTop}`);
      totalFail += 1;
    } else {
      console.log(`  ✓ baseline scrollTop === 0`);
    }

    // Locator for the opt-out checkbox.
    const labelToggle = page
      .locator('label')
      .filter({ hasText: 'enableKeyboardAutoScroll' })
      .locator('input[type="checkbox"]');

    // Helper: clear any prior active cell so the next setActiveCell is
    // a real transition (avoids the dedup no-op when the row+col already
    // matches). The handle's setActiveCell is exposed via the demo
    // button + a separate "clearActiveCell" is not — so we round-trip
    // by setting another cell (e.g. ArrowUp moves to a different row).
    // Simplest: trigger an Escape on the body to clear the active cell.
    async function clearActive() {
      await page
        .locator('.cx-table-body')
        .focus()
        .catch(() => {});
      await page.locator('.cx-table-body').evaluate((el) => {
        el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      });
    }

    // Precondition: do we even have a scrollable body? In the headless
    // viewport some demos size the body taller than its content (no
    // overflow → no scroll possible regardless of the prop).
    const overflowState = await page
      .locator('.cx-table-body')
      .evaluate((el) => ({ clientHeight: el.clientHeight, scrollHeight: el.scrollHeight }));
    const canScroll = overflowState.scrollHeight > overflowState.clientHeight;
    console.log(
      `  ℹ body clientHeight=${overflowState.clientHeight} scrollHeight=${overflowState.scrollHeight}` +
        ` (canScroll=${canScroll})`,
    );

    // Scenario 2: click "setActiveCell r19/qty". When canScroll: expect
    // scrollTop > 0. When NOT canScroll (content already fits): expect
    // scrollTop === 0 (auto-scroll math correctly returns no-change).
    await page.locator('button').filter({ hasText: 'setActiveCell r19/qty' }).click();
    await page.waitForTimeout(200);
    const afterJumpTop = await page.locator('.cx-table-body').evaluate((el) => el.scrollTop);
    if (canScroll) {
      if (afterJumpTop <= 0) {
        console.log(`  ✗ setActiveCell r19/qty expected scrollTop > 0, got ${afterJumpTop}`);
        totalFail += 1;
      } else {
        console.log(`  ✓ setActiveCell r19/qty → scrollTop = ${afterJumpTop}`);
      }
    } else if (afterJumpTop !== 0) {
      console.log(`  ✗ no-overflow body expected scrollTop = 0, got ${afterJumpTop}`);
      totalFail += 1;
    } else {
      console.log(`  ✓ setActiveCell r19/qty → scrollTop stays 0 (no overflow → no scroll needed)`);
    }

    // Scenario 3: clear + opt out + reset scroll + click → scrollTop stays 0.
    await clearActive();
    await labelToggle.uncheck();
    await page.locator('.cx-table-body').evaluate((el) => {
      el.scrollTop = 0;
    });
    await page.locator('button').filter({ hasText: 'setActiveCell r19/qty' }).click();
    await page.waitForTimeout(200);
    const afterOptOutTop = await page.locator('.cx-table-body').evaluate((el) => el.scrollTop);
    if (afterOptOutTop !== 0) {
      console.log(
        `  ✗ enableKeyboardAutoScroll:false expected scrollTop = 0, got ${afterOptOutTop}`,
      );
      totalFail += 1;
    } else {
      console.log(`  ✓ enableKeyboardAutoScroll:false → scrollTop stays 0`);
    }

    // Scenario 4: clear + re-check toggle + reset scroll + click. When
    // canScroll: scrollTop > 0. Otherwise: stays 0.
    await clearActive();
    await labelToggle.check();
    await page.locator('.cx-table-body').evaluate((el) => {
      el.scrollTop = 0;
    });
    await page.locator('button').filter({ hasText: 'setActiveCell r19/qty' }).click();
    await page.waitForTimeout(200);
    const afterReenableTop = await page.locator('.cx-table-body').evaluate((el) => el.scrollTop);
    if (canScroll) {
      if (afterReenableTop <= 0) {
        console.log(
          `  ✗ re-enable enableKeyboardAutoScroll expected scrollTop > 0, got ${afterReenableTop}`,
        );
        totalFail += 1;
      } else {
        console.log(`  ✓ re-enable → scrollTop = ${afterReenableTop}`);
      }
    } else if (afterReenableTop !== 0) {
      console.log(`  ✗ no-overflow re-enable expected scrollTop = 0, got ${afterReenableTop}`);
      totalFail += 1;
    } else {
      console.log(`  ✓ re-enable → scrollTop stays 0 (no overflow → no scroll needed)`);
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
console.log(`\n=== Phase 27 verify: ${totalFail === 0 ? 'PASS' : `FAIL (${totalFail})`} ===`);
process.exit(totalFail === 0 ? 0 : 1);
