import { defaultAxisRangePlanner } from '@chronixjs/gantt';
import { expect, test } from '@playwright/test';

import { CHART_SELECTOR, FROZEN_TIME_ISO, VIEWPORT } from '../src/config.js';

import type { Page } from '@playwright/test';

const settle = (page: Page) =>
  page.evaluate(
    () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
  );

async function loadDayView(page: Page) {
  await page.clock.install({ time: new Date(FROZEN_TIME_ISO) });
  await page.goto('/');
  const chart = page.locator(CHART_SELECTOR);
  await chart.waitFor({ state: 'visible' });
  await page.waitForLoadState('networkidle');
  await settle(page);
  await chart.getByRole('button', { name: '日', exact: true }).click();
  await settle(page);
  return chart;
}

/**
 * chronix-vs-k-ui parity assertions. Each test compares one observable
 * chronix output (a layout pass result) against what k-ui actually
 * renders into the DOM. Failures are interesting, not noise — the diff
 * IS the parity gap.
 */
test.describe('parity: chronix vs k-ui demo', () => {
  test('day-view tick labels (set equality)', async ({ page }) => {
    const axis = defaultAxisRangePlanner.plan({
      viewId: 'day',
      anchorDate: new Date(FROZEN_TIME_ISO),
      viewportWidth: VIEWPORT.width,
      locale: 'zh-CN',
      weekendsVisible: true,
    });
    const chronixLabels = axis.ticks.map((t) => t.label);
    const chart = await loadDayView(page);

    const kUiLabels = await chart.evaluate((root) => {
      const result: string[] = [];
      const seen = new Set<string>();
      root.querySelectorAll('*').forEach((node) => {
        if (node.children.length > 0) return;
        const txt = node.textContent?.trim() ?? '';
        if (/^\d+时$/.test(txt) && !seen.has(txt)) {
          seen.add(txt);
          result.push(txt);
        }
      });
      return result;
    });

    console.warn('chronix day-view labels:', chronixLabels);
    console.warn('k-ui   day-view labels:', kUiLabels);

    expect(chronixLabels).toHaveLength(24);
    expect(kUiLabels.length).toBeGreaterThan(0);
    expect(new Set(kUiLabels)).toEqual(new Set(chronixLabels));
  });

  test('day-view slot width (chronix slotWidth vs k-ui rendered spacing)', async ({ page }) => {
    const axis = defaultAxisRangePlanner.plan({
      viewId: 'day',
      anchorDate: new Date(FROZEN_TIME_ISO),
      viewportWidth: VIEWPORT.width,
      locale: 'zh-CN',
      weekendsVisible: true,
    });
    const chart = await loadDayView(page);

    // Extract each /\d+时/ tick's hour + viewport-x of its rendered label.
    // k-ui wraps each label in <text><title>N时</title></text>: matching
    // textContent of leaves catches the <title> (a 0×0 SVG tooltip element),
    // so we walk up to the first ancestor with non-zero rendered width —
    // the visible <text>. Keep the widest rect per hour to dedupe any
    // accessibility duplicates.
    const kUiTicks = await chart.evaluate((root) => {
      const byHour = new Map<number, { hour: number; left: number; width: number }>();
      root.querySelectorAll('*').forEach((node) => {
        if (node.children.length > 0) return;
        const txt = node.textContent?.trim() ?? '';
        const m = /^(\d+)时$/.exec(txt);
        if (!m) return;
        let candidate: Element | null = node;
        while (candidate) {
          const r = candidate.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) {
            const hour = Number(m[1]);
            const existing = byHour.get(hour);
            if (!existing || r.width > existing.width) {
              byHour.set(hour, { hour, left: r.left, width: r.width });
            }
            return;
          }
          candidate = candidate.parentElement;
        }
      });
      return [...byHour.values()].sort((a, b) => a.hour - b.hour);
    });

    expect(kUiTicks).toHaveLength(24);

    // Labels are CENTERED within their slot, so left-to-left deltas are
    // contaminated by label-width variance ("0时" is narrower than "10时").
    // Center-to-center distance cancels the label-width term and equals
    // the slot width directly.
    const centers = kUiTicks.map((t) => t.left + t.width / 2);
    const deltas: number[] = [];
    for (let i = 1; i < centers.length; i += 1) {
      const a = centers[i - 1];
      const b = centers[i];
      if (a === undefined || b === undefined) continue;
      deltas.push(b - a);
    }
    const avgDelta = deltas.reduce((acc, d) => acc + d, 0) / deltas.length;
    const minDelta = Math.min(...deltas);
    const maxDelta = Math.max(...deltas);

    console.warn('chronix slotWidth:', axis.slotWidth);
    console.warn('k-ui   slot width (avg, center-to-center):', avgDelta);
    console.warn('k-ui   slot width (min..max):', `${minDelta}..${maxDelta}`);

    // Uniformity check: ≤ 1px variance from sub-pixel rendering rounding.
    expect(maxDelta - minDelta).toBeLessThanOrEqual(1);

    // The real parity assertion. If this fails, chronix's hardcoded
    // SLOT_WIDTH_BY_VIEW.day is wrong relative to the reference.
    expect(Math.abs(avgDelta - axis.slotWidth)).toBeLessThanOrEqual(1);
  });
});
