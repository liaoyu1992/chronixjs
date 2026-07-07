import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'tmp-shots');

const targets = [
  { name: 'vue3', url: 'http://localhost:8711/' },
  { name: 'vue2', url: 'http://localhost:8712/' },
];

const browser = await chromium.launch();
for (const t of targets) {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  });
  const errors = [];
  const warnings = [];
  page.on('console', (msg) => {
    const type = msg.type();
    if (type === 'error') errors.push(msg.text());
    else if (type === 'warning') warnings.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`));

  console.log(`\n=== ${t.name} (${t.url}) ===`);
  try {
    await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForSelector('.demo-page__table', { timeout: 15000 });
    await page.waitForTimeout(1500);

    // Probe how many table sections rendered
    const sectionCount = await page.locator('.demo-page__table').count();
    const tableElCount = await page.locator('[class*="cx-table"]').count();
    console.log(`  sections(.demo-page__table): ${sectionCount}`);
    console.log(`  cx-table elements: ${tableElCount}`);

    // Probe pill rendering in header
    const pillCount = await page
      .locator('[class*="demo-page__"][class*="pill"], [class*="demo-page__"][class*="state"]')
      .count();
    console.log(`  header pill/state elements: ${pillCount}`);

    await page.screenshot({
      path: path.join(OUT, `${t.name}-probe-full.png`),
      fullPage: true,
    });
    await page
      .locator('.demo-page__table')
      .first()
      .screenshot({
        path: path.join(OUT, `${t.name}-probe-main.png`),
      });
  } catch (e) {
    errors.push(`[probe] ${e.message}`);
  }

  console.log(`  errors(${errors.length}):`);
  for (const e of errors) console.log(`    ! ${e}`);
  console.log(`  warnings(${warnings.length}):`);
  for (const w of warnings.slice(0, 10)) console.log(`    ~ ${w}`);

  await page.close();
}
await browser.close();
console.log('\ndone ->', OUT);
