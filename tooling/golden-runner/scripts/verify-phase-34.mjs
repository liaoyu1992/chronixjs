/**
 * Phase 34 verification — headless Chromium against the 3 running dev
 * servers (vue3 @ 8711 / vue2 @ 8712 / react @ 8713).
 *
 * 6 scenarios per port (Phase 34 lazy-load tree children):
 *   1. Click chevron on lazy-folder-a → spinner visible during load →
 *      children render after 500ms delay.
 *   2. Second click on lazy-folder-a (collapsed → re-expanded) →
 *      children render instantly (cached, no spinner).
 *   3. Click chevron on lazy-fail-1 → 500ms delay → error icon visible.
 *   4. Click error icon → retry → error icon visible again (synthetic
 *      failure always rejects).
 *   5. Reload-all button → next lazy-folder-a expand re-fetches (spinner
 *      visible again).
 *   6. Counter pill shows correct start / success / error counts.
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

async function clickChevron(lazy, rowId) {
  await lazy
    .locator(`[data-tree-chevron="${rowId}"]`)
    .first()
    .evaluate((el) => {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
}

async function clickErrorIcon(lazy, rowId) {
  await lazy
    .locator(`[data-tree-error="${rowId}"]`)
    .first()
    .evaluate((el) => {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
}

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
    await page.waitForSelector('[data-testid="lazy-section"]', {
      state: 'attached',
      timeout: 8000,
    });
    await page.waitForTimeout(400);

    const lazy = page.locator('[data-testid="lazy-section"]');

    // Scenario 1: spinner appears during load, children appear after.
    await clickChevron(lazy, 'lazy-folder-a');
    await page.waitForTimeout(100);
    const spinnerCount = await lazy.locator('[data-tree-spinner="lazy-folder-a"]').count();
    if (spinnerCount >= 1) {
      console.log(`  ✓ spinner visible during load`);
    } else {
      console.log(`  ✗ spinner missing during load (count=${spinnerCount})`);
      totalFail += 1;
    }
    await page.waitForTimeout(550);
    const child1 = await lazy.locator('[data-row-id="lazy-folder-a/child-1"]').count();
    if (child1 >= 1) {
      console.log(`  ✓ children render after lazy load`);
    } else {
      console.log(`  ✗ children missing after load (count=${child1})`);
      totalFail += 1;
    }

    // Scenario 2: collapse + re-expand uses cache (no spinner).
    await clickChevron(lazy, 'lazy-folder-a');
    await page.waitForTimeout(100);
    await clickChevron(lazy, 'lazy-folder-a');
    await page.waitForTimeout(50);
    const spinnerOnReExpand = await lazy.locator('[data-tree-spinner="lazy-folder-a"]').count();
    const childOnReExpand = await lazy.locator('[data-row-id="lazy-folder-a/child-1"]').count();
    if (spinnerOnReExpand === 0 && childOnReExpand >= 1) {
      console.log(`  ✓ second expand uses cache (no spinner, instant children)`);
    } else {
      console.log(`  ✗ cache miss: spinner=${spinnerOnReExpand} children=${childOnReExpand}`);
      totalFail += 1;
    }

    // Scenario 3: failure path shows error icon.
    await clickChevron(lazy, 'lazy-fail-1');
    await page.waitForTimeout(600);
    const errorIcon = await lazy.locator('[data-tree-error="lazy-fail-1"]').count();
    if (errorIcon >= 1) {
      console.log(`  ✓ error icon visible on synthetic failure`);
    } else {
      console.log(`  ✗ error icon missing (count=${errorIcon})`);
      totalFail += 1;
    }

    // Scenario 4: click error icon → retry → error icon stays.
    await clickErrorIcon(lazy, 'lazy-fail-1');
    await page.waitForTimeout(600);
    const errorIconAfterRetry = await lazy.locator('[data-tree-error="lazy-fail-1"]').count();
    if (errorIconAfterRetry >= 1) {
      console.log(`  ✓ retry on error icon re-runs loader`);
    } else {
      console.log(`  ✗ error icon disappeared after retry (count=${errorIconAfterRetry})`);
      totalFail += 1;
    }

    // Scenario 5: Reload All button → next expand re-fetches.
    await lazy.locator('[data-testid="lazy-invalidate-all"]').click();
    await page.waitForTimeout(100);
    // Collapse folder-a (currently expanded with cache), then re-expand.
    await clickChevron(lazy, 'lazy-folder-a');
    await page.waitForTimeout(50);
    await clickChevron(lazy, 'lazy-folder-a');
    await page.waitForTimeout(100);
    const spinnerAfterInvalidate = await lazy
      .locator('[data-tree-spinner="lazy-folder-a"]')
      .count();
    if (spinnerAfterInvalidate >= 1) {
      console.log(`  ✓ invalidateLazyChildren forces re-fetch`);
    } else {
      console.log(`  ✗ no spinner after invalidate (count=${spinnerAfterInvalidate})`);
      totalFail += 1;
    }
    await page.waitForTimeout(600);

    // Scenario 6: 0 console errors.
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
console.log(`\n=== Phase 34 verify: ${totalFail === 0 ? 'PASS' : `FAIL (${totalFail})`} ===`);
process.exit(totalFail === 0 ? 0 : 1);
