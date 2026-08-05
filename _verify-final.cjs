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

  await page.goto('https://liaoyu1992.github.io/chronixjs/gantt/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);

  // Check SVG dimensions
  const info = await page.evaluate(() => {
    const preview = document.querySelector('.feature-showcase__preview');
    const svgs = preview?.querySelectorAll('svg');
    return {
      previewHeight: preview?.getBoundingClientRect().height,
      svgCount: svgs?.length,
      svgHeights: Array.from(svgs || []).map((s) => s.getBoundingClientRect().height),
    };
  });
  console.log('Online:', JSON.stringify(info, null, 2));

  // Scroll to showcase and screenshot
  await page.evaluate(() => {
    document
      .querySelector('.feature-showcase')
      ?.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshot-gantt-online-final.png', fullPage: false });

  // Click feature 2 (links) and screenshot
  await page.evaluate(() => {
    const items = document.querySelectorAll('.feature-showcase__nav-item');
    if (items[2]) items[2].click();
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshot-gantt-online-links.png', fullPage: false });

  await browser.close();
  console.log('Done!');
})();
