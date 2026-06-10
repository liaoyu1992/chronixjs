/**
 * Phase 35 + 36 verification — headless Chromium against the 3 running
 * dev servers (vue3 @ 8711 / vue2 @ 8712 / react @ 8713).
 *
 * 4 scenarios per port:
 *   1. Status bar renders with default content + correct base row count
 *      ("50 行" — main demo has 50 rows).
 *   2. CSV export button triggers an anchor download with the configured
 *      filename + valid CSV string content.
 *   3. Export contains the column header row + at least one body row.
 *   4. 0 console errors.
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
    await page.waitForSelector('[data-testid="cx-status-bar"]', {
      state: 'attached',
      timeout: 8000,
    });
    await page.waitForTimeout(400);

    // Scenario 1: status bar visible + contains "50 行".
    const statusBar = page.locator('[data-testid="cx-status-bar"]').first();
    const statusText = await statusBar.textContent();
    if (statusText != null && statusText.includes('50 行')) {
      console.log(`  ✓ status bar renders with default content (got "${statusText.trim()}")`);
    } else {
      console.log(`  ✗ status bar text missing "50 行" (got "${statusText}")`);
      totalFail += 1;
    }

    // Scenario 2 + 3: intercept the URL.createObjectURL → anchor.click
    // → download trigger. Hook anchor.click via prototype override BEFORE
    // pressing the export button.
    const exportResult = await page.evaluate(async () => {
      const captured = { csvText: null, filename: null };
      // Patch URL.createObjectURL to capture the Blob.
      const origCreateUrl = URL.createObjectURL.bind(URL);
      URL.createObjectURL = function (b) {
        if (b instanceof Blob) {
          captured.blobMime = b.type;
          // Read blob asynchronously; store the promise on captured.
          captured.csvPromise = b.text();
        }
        return origCreateUrl(b);
      };
      // Patch HTMLAnchorElement.prototype.click to intercept download.
      const origClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () {
        if (this.hasAttribute('data-cx-table-csv-download')) {
          captured.filename =
            this.getAttribute('download') ?? this.getAttribute('data-cx-table-csv-download');
          // Don't actually trigger download in headless test.
          return;
        }
        return origClick.call(this);
      };
      // Click the button.
      const btn = document.querySelector('[data-testid="csv-export-btn"]');
      if (btn != null) btn.click();
      // Wait for async blob text resolution.
      const csvText = captured.csvPromise != null ? await captured.csvPromise : null;
      // Restore patches.
      URL.createObjectURL = origCreateUrl;
      HTMLAnchorElement.prototype.click = origClick;
      return { csvText, filename: captured.filename };
    });

    if (
      exportResult.filename === 'chronix-table-demo.csv' &&
      exportResult.csvText != null &&
      exportResult.csvText.length > 0
    ) {
      console.log(`  ✓ CSV export triggered download with filename "${exportResult.filename}"`);
      // Scenario 3: header row + body rows present.
      const lines = exportResult.csvText.split(/\r\n|\n/);
      if (lines.length >= 2 && lines[0].includes('ID') && lines[1].length > 0) {
        console.log(`  ✓ CSV contains header + body (${lines.length} lines)`);
      } else {
        console.log(`  ✗ CSV missing header or body (lines=${lines.length})`);
        totalFail += 1;
      }
    } else {
      console.log(
        `  ✗ CSV export did not trigger expected download (filename=${exportResult.filename}, csv length=${exportResult.csvText?.length ?? 0})`,
      );
      totalFail += 1;
    }

    // Scenario 4: console errors clean.
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
console.log(`\n=== Phase 35+36 verify: ${totalFail === 0 ? 'PASS' : `FAIL (${totalFail})`} ===`);
process.exit(totalFail === 0 ? 0 : 1);
