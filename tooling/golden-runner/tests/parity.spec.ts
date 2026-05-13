import { defaultAxisRangePlanner } from '@chronixjs/gantt';
import { expect, test } from '@playwright/test';

import { CHART_SELECTOR, FROZEN_TIME_ISO, VIEWPORT } from '../src/config.js';

/**
 * First chronix-vs-k-ui parity assertion. Compares the day-view tick
 * label set chronix produces against the labels k-ui renders into the
 * DOM. Anything chronix tests prior to this commit was internal
 * consistency only — this is the first check that chronix's output
 * actually agrees with the reference codebase.
 *
 * Failures are interesting, not noise. The diff between the two
 * arrays IS the parity gap.
 */
test.describe('parity: chronix vs k-ui demo', () => {
  test('day-view tick labels', async ({ page }) => {
    // Build chronix-side data with the same anchor + locale as the demo.
    const axis = defaultAxisRangePlanner.plan({
      viewId: 'day',
      anchorDate: new Date(FROZEN_TIME_ISO),
      viewportWidth: VIEWPORT.width,
      locale: 'zh-CN',
      weekendsVisible: true,
    });
    const chronixLabels = axis.ticks.map((t) => t.label);

    // Drive the k-ui demo.
    await page.clock.install({ time: new Date(FROZEN_TIME_ISO) });
    await page.goto('/');
    const chart = page.locator(CHART_SELECTOR);
    await chart.waitFor({ state: 'visible' });
    await page.waitForLoadState('networkidle');
    await page.evaluate(
      () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
    );
    await chart.getByRole('button', { name: '日', exact: true }).click();
    await page.evaluate(
      () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
    );

    // Extract anything in the chart that looks like an hour label ("N时").
    // Selector-agnostic for first probe — narrow once we see what k-ui ships.
    const kUiLabels = await chart.evaluate((root) => {
      const result: string[] = [];
      const seen = new Set<string>();
      root.querySelectorAll('*').forEach((node) => {
        // Skip nodes with element children — we want leaves with text.
        if (node.children.length > 0) return;
        const txt = node.textContent?.trim() ?? '';
        if (/^\d+时$/.test(txt) && !seen.has(txt)) {
          seen.add(txt);
          result.push(txt);
        }
      });
      return result;
    });

    // Log both for transparency on first run; the diff will probably
    // surface format differences we want to know about.

    console.warn('chronix day-view labels:', chronixLabels);

    console.warn('k-ui   day-view labels:', kUiLabels);

    // Assertion order is intentional: count first (it should be 24),
    // then exact set match. Failure messages stay readable.
    expect(chronixLabels).toHaveLength(24);
    expect(kUiLabels.length).toBeGreaterThan(0);
    // Loose first comparison: are the sets identical, ignoring order?
    // Strict ordered comparison can come once we know the k-ui DOM order.
    expect(new Set(kUiLabels)).toEqual(new Set(chronixLabels));
  });
});
