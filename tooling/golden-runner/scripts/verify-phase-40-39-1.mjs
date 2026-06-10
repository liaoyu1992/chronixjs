/**
 * Phase 40 + 39.1 verification — headless Chromium against the 3
 * running dev servers (vue3 @ 8711 / vue2 @ 8712 / react @ 8713).
 *
 * 4 scenarios per port:
 *   1. Wrapper carries `role="grid"` + non-empty `aria-rowcount` +
 *      non-empty `aria-colcount`.
 *   2. Off-screen `.cx-table-sr-announce` div renders with
 *      `role="status"` + `aria-live="polite"`.
 *   3. Clicking "Export 3-sheet XLSX" triggers a Blob download with
 *      the XLSX mimetype + filename = "chronix-table-multi-sheet.xlsx"
 *      AND the Blob byte size is larger than a single-sheet xlsx
 *      counterpart (multi-sheet contains 3 worksheets so it MUST be
 *      bigger).
 *   4. 0 console errors throughout.
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
    await page.waitForSelector('[data-testid="xlsx-multisheet-btn"]', {
      state: 'attached',
      timeout: 8000,
    });
    await page.waitForTimeout(300);

    // Scenario 1: wrapper aria attrs.
    const wrapperInfo = await page.evaluate(() => {
      const el = document.querySelector('.cx-table-wrapper');
      if (!el) return null;
      return {
        role: el.getAttribute('role'),
        rowcount: el.getAttribute('aria-rowcount'),
        colcount: el.getAttribute('aria-colcount'),
      };
    });
    if (
      wrapperInfo != null &&
      wrapperInfo.role === 'grid' &&
      wrapperInfo.rowcount != null &&
      Number(wrapperInfo.rowcount) > 0 &&
      wrapperInfo.colcount != null &&
      Number(wrapperInfo.colcount) > 0
    ) {
      console.log(
        `  ✓ wrapper role=grid + aria-rowcount=${wrapperInfo.rowcount} + aria-colcount=${wrapperInfo.colcount}`,
      );
    } else {
      console.log(`  ✗ wrapper aria attrs missing: ${JSON.stringify(wrapperInfo)}`);
      totalFail += 1;
    }

    // Scenario 2: live region.
    const liveInfo = await page.evaluate(() => {
      const el = document.querySelector('.cx-table-sr-announce');
      if (!el) return null;
      return {
        role: el.getAttribute('role'),
        ariaLive: el.getAttribute('aria-live'),
        ariaAtomic: el.getAttribute('aria-atomic'),
      };
    });
    if (
      liveInfo != null &&
      liveInfo.role === 'status' &&
      liveInfo.ariaLive === 'polite' &&
      liveInfo.ariaAtomic === 'true'
    ) {
      console.log('  ✓ live region role=status + aria-live=polite + aria-atomic=true');
    } else {
      console.log(`  ✗ live region missing/incorrect: ${JSON.stringify(liveInfo)}`);
      totalFail += 1;
    }

    // Scenario 3: multi-sheet download produces a larger blob than
    // single-sheet. Intercept downloads in arrays so single and multi
    // captures don't collide. Wait for each export to fully complete
    // before triggering the next one (the demo's xlsxBusy flag would
    // otherwise reject the second click as a no-op).
    const exportResult = await page.evaluate(async () => {
      const sizes = [];
      const mimes = [];
      const filenames = [];
      const origCreateUrl = URL.createObjectURL.bind(URL);
      URL.createObjectURL = function (b) {
        if (b instanceof Blob) {
          sizes.push(b.size);
          mimes.push(b.type);
        }
        return origCreateUrl(b);
      };
      const origClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () {
        if (this.hasAttribute('data-cx-table-xlsx-download')) {
          filenames.push(this.getAttribute('download'));
          return;
        }
        return origClick.call(this);
      };
      // Step 1: trigger single-sheet export and wait for its capture.
      const singleBtn = document.querySelector('[data-testid="xlsx-export-btn"]');
      if (!singleBtn) return { error: 'single-sheet button not found' };
      singleBtn.click();
      const singleDeadline = Date.now() + 6000;
      while (Date.now() < singleDeadline && filenames.length < 1) {
        await new Promise((r) => setTimeout(r, 100));
      }
      // Allow the busy flag to clear before the second click.
      await new Promise((r) => setTimeout(r, 250));
      // Step 2: trigger multi-sheet export.
      const multiBtn = document.querySelector('[data-testid="xlsx-multisheet-btn"]');
      if (!multiBtn) return { error: 'multi-sheet button not found' };
      multiBtn.click();
      const multiDeadline = Date.now() + 6000;
      while (Date.now() < multiDeadline && filenames.length < 2) {
        await new Promise((r) => setTimeout(r, 100));
      }
      return {
        singleSize: sizes[0] ?? 0,
        singleFilename: filenames[0] ?? null,
        multiSize: sizes[1] ?? 0,
        multiFilename: filenames[1] ?? null,
        multiMime: mimes[1] ?? null,
      };
    });

    if (exportResult.error) {
      console.log(`  ✗ ${exportResult.error}`);
      totalFail += 1;
    } else {
      const expectedMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      if (
        exportResult.multiFilename === 'chronix-table-multi-sheet.xlsx' &&
        exportResult.multiMime === expectedMime &&
        exportResult.multiSize > exportResult.singleSize
      ) {
        console.log(
          `  ✓ multi-sheet blob ${exportResult.multiSize}B > single-sheet ${exportResult.singleSize}B; filename + mimetype OK`,
        );
      } else {
        console.log(`  ✗ multi-sheet result unexpected: ${JSON.stringify(exportResult)}`);
        totalFail += 1;
      }
    }

    // Scenario 4: 0 console errors.
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
