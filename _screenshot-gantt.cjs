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
  await page.waitForTimeout(4000);

  // Scroll to the showcase
  await page.evaluate(() => {
    document
      .querySelector('.feature-showcase')
      ?.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(2000);

  // Take full viewport screenshot
  await page.screenshot({ path: 'screenshot-gantt-current.png', fullPage: false });

  // Also inspect the actual SVG / chart dimensions
  const info = await page.evaluate(() => {
    const preview = document.querySelector('.feature-showcase__preview');
    const svg = document.querySelector('.feature-showcase__preview svg');
    const ganttContainer = document.querySelector('.feature-showcase__preview > div');
    const previewRect = preview?.getBoundingClientRect();
    const svgRect = svg?.getBoundingClientRect();
    const containerRect = ganttContainer?.getBoundingClientRect();
    return {
      preview: previewRect
        ? {
            width: previewRect.width,
            height: previewRect.height,
          }
        : null,
      innerContainer: containerRect
        ? {
            width: containerRect.width,
            height: containerRect.height,
            style: ganttContainer?.getAttribute('style'),
          }
        : null,
      svg: svgRect
        ? {
            width: svgRect.width,
            height: svgRect.height,
            viewBox: svg?.getAttribute('viewBox'),
            style: svg?.getAttribute('style'),
          }
        : null,
    };
  });
  console.log('Chart info:', JSON.stringify(info, null, 2));

  await browser.close();
  console.log('Screenshot saved!');
})();
