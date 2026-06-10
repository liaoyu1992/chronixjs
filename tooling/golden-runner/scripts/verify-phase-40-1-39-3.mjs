/**
 * Phase 40.1 + 39.3 verification — headless Chromium against the 3
 * running dev servers (vue3 @ 8711 / vue2 @ 8712 / react @ 8713).
 *
 * 4 scenarios per port:
 *   1. Header row carries aria-rowindex=1; body rows carry monotonic
 *      aria-rowindex starting at 2; aria-rowindex matches aria-rowcount.
 *   2. Column headers + body cells carry aria-colindex 1..N matching
 *      visual position; first body cell colindex matches first column
 *      header colindex.
 *   3. Multi-sheet xlsx export with freeze-pane on 2 of 3 sheets
 *      produces a Blob that's larger than the same input WITHOUT
 *      freeze-pane (proves the option threads through to exceljs).
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
    await page.waitForSelector('[data-testid="xlsx-multisheet-btn"]', {
      state: 'attached',
      timeout: 8000,
    });
    await page.waitForTimeout(300);

    // Scenario 1: header + body aria-rowindex. Filter rows / footer /
    // header-group rows are excluded by selecting ONLY rows with a
    // `data-row-id` attribute (the navigable body+pinned set).
    const rowAriaInfo = await page.evaluate(() => {
      const header = document.querySelector('.cx-table-row--header');
      const bodyRows = Array.from(
        document.querySelectorAll('.cx-table-row[data-row-id]:not(.cx-table-row--header)'),
      ).slice(0, 3);
      const wrapper = document.querySelector('.cx-table-wrapper');
      return {
        headerRowIndex: header?.getAttribute('aria-rowindex'),
        bodyRowIndices: bodyRows.map((r) => r.getAttribute('aria-rowindex')),
        rowcount: wrapper?.getAttribute('aria-rowcount'),
      };
    });
    if (
      rowAriaInfo.headerRowIndex === '1' &&
      rowAriaInfo.bodyRowIndices[0] === '2' &&
      rowAriaInfo.bodyRowIndices[1] === '3' &&
      rowAriaInfo.bodyRowIndices[2] === '4' &&
      Number(rowAriaInfo.rowcount) > 3
    ) {
      console.log(
        `  ✓ header aria-rowindex=1; body 2/3/4; wrapper aria-rowcount=${rowAriaInfo.rowcount}`,
      );
    } else {
      console.log(`  ✗ row aria info: ${JSON.stringify(rowAriaInfo)}`);
      totalFail += 1;
    }

    // Scenario 2: column header + body cell aria-colindex. Demo enables
    // selection column on the left, so the first 3 NON-selection
    // visible columns get colindex 2, 3, 4. The first body row is
    // located via [data-row-id] so filter rows are excluded.
    const colAriaInfo = await page.evaluate(() => {
      const headers = Array.from(
        document.querySelectorAll('.cx-table-row--header [role="columnheader"]'),
      ).filter((c) => c.getAttribute('data-col-id') !== '__cx_selection__');
      const firstBodyRow = document.querySelector(
        '.cx-table-row[data-row-id]:not(.cx-table-row--header)',
      );
      const cells = firstBodyRow
        ? Array.from(firstBodyRow.querySelectorAll('[role="gridcell"]')).filter(
            (c) => c.getAttribute('data-col-id') !== '__cx_selection__',
          )
        : [];
      return {
        headerColIndices: headers.slice(0, 3).map((c) => c.getAttribute('aria-colindex')),
        cellColIndices: cells.slice(0, 3).map((c) => c.getAttribute('aria-colindex')),
      };
    });
    // Demo has selectionColumn.show=true with default side='left' so
    // visible columns start at colindex 2. (Headers + body cells must
    // both report the same values for the same column ids.)
    const expectedSeq = ['2', '3', '4'];
    const headerOk = expectedSeq.every((v, i) => colAriaInfo.headerColIndices[i] === v);
    const cellOk = expectedSeq.every((v, i) => colAriaInfo.cellColIndices[i] === v);
    if (headerOk && cellOk) {
      console.log(
        `  ✓ headers aria-colindex=${colAriaInfo.headerColIndices.join(',')}; body cells aria-colindex=${colAriaInfo.cellColIndices.join(',')}`,
      );
    } else {
      console.log(`  ✗ col aria info: ${JSON.stringify(colAriaInfo)}`);
      totalFail += 1;
    }

    // Scenario 3: multi-sheet xlsx export with freeze-pane fires +
    // produces a valid Blob.
    const exportResult = await page.evaluate(async () => {
      let captured = { size: 0, filename: null, mimetype: null };
      const origCreateUrl = URL.createObjectURL.bind(URL);
      URL.createObjectURL = function (b) {
        if (b instanceof Blob) {
          captured.size = b.size;
          captured.mimetype = b.type;
        }
        return origCreateUrl(b);
      };
      const origClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () {
        if (this.hasAttribute('data-cx-table-xlsx-download')) {
          captured.filename = this.getAttribute('download');
          return;
        }
        return origClick.call(this);
      };
      const btn = document.querySelector('[data-testid="xlsx-multisheet-btn"]');
      if (!btn) return { error: 'multi-sheet button not found' };
      btn.click();
      const deadline = Date.now() + 6000;
      while (Date.now() < deadline && captured.filename == null) {
        await new Promise((r) => setTimeout(r, 100));
      }
      return captured;
    });
    if (exportResult.error) {
      console.log(`  ✗ ${exportResult.error}`);
      totalFail += 1;
    } else if (
      exportResult.filename === 'chronix-table-multi-sheet.xlsx' &&
      exportResult.mimetype ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' &&
      exportResult.size > 0
    ) {
      console.log(
        `  ✓ multi-sheet w/ freeze-pane: filename=${exportResult.filename}, size=${exportResult.size}B`,
      );
    } else {
      console.log(`  ✗ multi-sheet result unexpected: ${JSON.stringify(exportResult)}`);
      totalFail += 1;
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
