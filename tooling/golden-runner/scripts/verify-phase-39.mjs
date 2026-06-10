/**
 * Phase 39 verification — headless Chromium against the 3 running dev
 * servers (vue3 @ 8711 / vue2 @ 8712 / react @ 8713).
 *
 * 4 scenarios per port:
 *   1. Export XLSX button renders + enables.
 *   2. Clicking the button triggers a Blob download with the XLSX
 *      mimetype (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet).
 *   3. Filename matches "chronix-table-demo.xlsx".
 *   4. 0 console errors during the export (including no missing-exceljs
 *      error since each demo installs exceljs locally).
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
    await page.waitForSelector('[data-testid="xlsx-export-btn"]', {
      state: 'attached',
      timeout: 8000,
    });
    await page.waitForTimeout(300);

    // Scenario 1: Export XLSX button renders.
    const btn = page.locator('[data-testid="xlsx-export-btn"]').first();
    const visible = await btn.isVisible();
    if (visible) {
      console.log('  ✓ Export XLSX button renders');
    } else {
      console.log('  ✗ Export XLSX button not visible');
      totalFail += 1;
    }

    // Scenarios 2 + 3: intercept the download via the same pattern as
    // verify-phase-35-36 — patch URL.createObjectURL + anchor.click,
    // capture the Blob's mimetype + filename, await the async export.
    const exportResult = await page.evaluate(async () => {
      const captured = { mimetype: null, filename: null, size: 0 };
      const origCreateUrl = URL.createObjectURL.bind(URL);
      URL.createObjectURL = function (b) {
        if (b instanceof Blob) {
          captured.mimetype = b.type;
          captured.size = b.size;
        }
        return origCreateUrl(b);
      };
      const origClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () {
        if (this.hasAttribute('data-cx-table-xlsx-download')) {
          captured.filename =
            this.getAttribute('download') ?? this.getAttribute('data-cx-table-xlsx-download');
          return;
        }
        return origClick.call(this);
      };
      const xlsxBtn = document.querySelector('[data-testid="xlsx-export-btn"]');
      if (!xlsxBtn) return { error: 'button not found' };
      xlsxBtn.click();
      // Async — wait for the exceljs lazy chunk to load + workbook to
      // serialize. Poll for up to 5 seconds.
      const deadline = Date.now() + 5000;
      while (Date.now() < deadline && captured.filename == null) {
        await new Promise((r) => setTimeout(r, 100));
      }
      return captured;
    });

    if (exportResult.error) {
      console.log(`  ✗ ${exportResult.error}`);
      totalFail += 1;
    } else {
      const expectedMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      if (exportResult.mimetype === expectedMime) {
        console.log(`  ✓ Blob mimetype = "${expectedMime}"`);
      } else {
        console.log(`  ✗ Blob mimetype was "${exportResult.mimetype}", expected "${expectedMime}"`);
        totalFail += 1;
      }
      if (exportResult.filename === 'chronix-table-demo.xlsx') {
        console.log(
          `  ✓ Filename = "chronix-table-demo.xlsx" (Blob size ${exportResult.size} bytes)`,
        );
      } else {
        console.log(
          `  ✗ Filename was "${exportResult.filename}", expected "chronix-table-demo.xlsx"`,
        );
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
