const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath:
      'C:\\Users\\liaoyu\\playwright-browsers\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
  });

  await page.goto('http://localhost:4174/chronixjs/gantt/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);

  // Check SVG dimensions for each feature
  for (let i = 0; i < 5; i++) {
    // Click feature i
    await page.evaluate((idx) => {
      const items = document.querySelectorAll('.feature-showcase__nav-item');
      if (items[idx]) items[idx].click();
    }, i);
    await page.waitForTimeout(2000);

    const info = await page.evaluate(() => {
      const preview = document.querySelector('.feature-showcase__preview');
      const svgs = preview?.querySelectorAll('svg');
      const innerDiv = preview?.querySelector('div');
      return {
        previewHeight: preview?.getBoundingClientRect().height,
        innerHeight: innerDiv?.getBoundingClientRect().height,
        svgCount: svgs?.length,
        svgHeights: Array.from(svgs || []).map((s) => s.getBoundingClientRect().height),
        svgWidths: Array.from(svgs || []).map((s) => s.getBoundingClientRect().width),
      };
    });
    console.log(`Feature ${i}:`, JSON.stringify(info));
  }

  // Take screenshot of feature 0 (basic)
  await page.evaluate(() => {
    const items = document.querySelectorAll('.feature-showcase__nav-item');
    if (items[0]) items[0].click();
  });
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    document
      .querySelector('.feature-showcase')
      ?.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshot-gantt-14rows.png', fullPage: false });

  // Take screenshot of feature 2 (links)
  await page.evaluate(() => {
    const items = document.querySelectorAll('.feature-showcase__nav-item');
    if (items[2]) items[2].click();
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'screenshot-gantt-links-14rows.png', fullPage: false });

  await browser.close();
  console.log('Done!');
})();
