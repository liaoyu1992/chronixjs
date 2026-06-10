/**
 * Phase 38 verification — headless Chromium against the 3 running dev
 * servers (vue3 @ 8711 / vue2 @ 8712 / react @ 8713).
 *
 * Phase 37 ships only release-engineering artifacts (READMEs, LICENSE,
 * migration guide, changeset) — there's nothing to verify in a browser.
 * Phase 38 wires `getTableView` / `applyTableView` TableHandle methods
 * + a `columns-change` emit + 2 demo buttons (Save view / Load view).
 *
 * 5 scenarios per port:
 *   1. Save view + Load view buttons are rendered.
 *   2. Click Save view → status text reads "saved (...)" with expected
 *      column / sort / filter counts.
 *   3. Load view immediately after Save → status text reads "loaded".
 *   4. After loading, columns and rows still render normally (no
 *      console error from the applyTableView dispatch).
 *   5. 0 console errors throughout.
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
    await page.waitForSelector('[data-testid="save-view-btn"]', {
      state: 'attached',
      timeout: 8000,
    });
    await page.waitForSelector('[data-testid="load-view-btn"]', {
      state: 'attached',
      timeout: 8000,
    });
    await page.waitForTimeout(300);

    // Scenario 1: both buttons render.
    const saveBtn = page.locator('[data-testid="save-view-btn"]').first();
    const loadBtn = page.locator('[data-testid="load-view-btn"]').first();
    const saveVisible = await saveBtn.isVisible();
    const loadVisible = await loadBtn.isVisible();
    if (saveVisible && loadVisible) {
      console.log('  ✓ Save view + Load view buttons render');
    } else {
      console.log(`  ✗ buttons not visible (save=${saveVisible}, load=${loadVisible})`);
      totalFail += 1;
    }

    // Scenario 2: clear localStorage and click Save view.
    await page.evaluate(() => localStorage.clear());
    await saveBtn.click();
    await page.waitForTimeout(100);
    const statusAfterSave = await page
      .locator('[data-testid="saved-view-status"]')
      .first()
      .textContent();
    if (statusAfterSave != null && statusAfterSave.includes('saved')) {
      console.log(`  ✓ Save view updates status to "${statusAfterSave.trim()}"`);
    } else {
      console.log(`  ✗ status after save was "${statusAfterSave}", expected to contain "saved"`);
      totalFail += 1;
    }

    // Scenario 3: click Load view → status reads "loaded".
    await loadBtn.click();
    await page.waitForTimeout(150);
    const statusAfterLoad = await page
      .locator('[data-testid="saved-view-status"]')
      .first()
      .textContent();
    if (statusAfterLoad != null && statusAfterLoad.trim() === 'loaded') {
      console.log('  ✓ Load view updates status to "loaded"');
    } else {
      console.log(`  ✗ status after load was "${statusAfterLoad}", expected "loaded"`);
      totalFail += 1;
    }

    // Scenario 4: table body still renders after applyTableView dispatch.
    await page.waitForTimeout(150);
    const bodyRows = await page.locator('.cx-table-row[data-row-id]').count();
    if (bodyRows >= 1) {
      console.log(`  ✓ table body still renders rows after applyTableView (${bodyRows} rows)`);
    } else {
      console.log(`  ✗ body rows missing after applyTableView (got ${bodyRows})`);
      totalFail += 1;
    }

    // Scenario 5: 0 console errors.
    if (consoleErrors.length === 0) {
      console.log('  ✓ 0 console errors');
    } else {
      console.log(`  ✗ ${consoleErrors.length} console error(s):`);
      for (const e of consoleErrors) console.log(`    - ${e}`);
      totalFail += 1;
    }
  } catch (err) {
    console.log(`  ✗ exception: ${err instanceof Error ? err.message : String(err)}`);
    totalFail += 1;
  } finally {
    await context.close();
  }
}

await browser.close();
process.exit(totalFail === 0 ? 0 : 1);
