import {
  defaultAxisRangePlanner,
  defaultBarPlacementPass,
  defaultRowSwimlaneLayout,
} from '@chronixjs/gantt';
import { expect, test } from '@playwright/test';

import { CHART_SELECTOR, FROZEN_TIME_ISO, VIEWPORT } from '../src/config.js';

import type { BarSpec, RowSpec, ViewId } from '@chronixjs/gantt';
import type { Locator, Page } from '@playwright/test';

const settle = (page: Page) =>
  page.evaluate(
    () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
  );

async function loadView(page: Page, viewToggleLabel: string) {
  await page.clock.install({ time: new Date(FROZEN_TIME_ISO) });
  await page.goto('/');
  const chart = page.locator(CHART_SELECTOR);
  await chart.waitFor({ state: 'visible' });
  await page.waitForLoadState('networkidle');
  await settle(page);
  await chart.getByRole('button', { name: viewToggleLabel, exact: true }).click();
  await settle(page);
  return chart;
}

const loadDayView = (page: Page) => loadView(page, '日');

/**
 * Pull rendered tick rects from k-ui's chart DOM. Matches leaves whose text
 * passes `labelRegex`, then walks up to the first ancestor with non-zero
 * rendered width — k-ui wraps each label as `<text><title>N时</title></text>`
 * and the `<title>` is a 0×0 SVG tooltip element, not the visible label.
 *
 * Deduplicates by `(rounded-left, label)` so views like "week" (where the
 * label "0时" appears once per day across 7 days) yield distinct positions
 * rather than collapsing on label text.
 */
async function extractRenderedTickRects(chart: Locator, labelRegex: RegExp) {
  return chart.evaluate((root, regexSource) => {
    const regex = new RegExp(regexSource);
    const seen = new Set<string>();
    const ticks: { label: string; left: number; width: number }[] = [];
    root.querySelectorAll('*').forEach((node) => {
      if (node.children.length > 0) return;
      const txt = node.textContent?.trim() ?? '';
      if (!regex.test(txt)) return;
      let candidate: Element | null = node;
      while (candidate) {
        const r = candidate.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          const key = `${Math.round(r.left)}|${txt}`;
          if (!seen.has(key)) {
            seen.add(key);
            ticks.push({ label: txt, left: r.left, width: r.width });
          }
          return;
        }
        candidate = candidate.parentElement;
      }
    });
    ticks.sort((a, b) => a.left - b.left);
    return ticks;
  }, labelRegex.source);
}

function deltasBetweenCenters(ticks: readonly { left: number; width: number }[]): number[] {
  const centers = ticks.map((t) => t.left + t.width / 2);
  const out: number[] = [];
  for (let i = 1; i < centers.length; i += 1) {
    const a = centers[i - 1];
    const b = centers[i];
    if (a === undefined || b === undefined) continue;
    out.push(b - a);
  }
  return out;
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
    const ticks = await extractRenderedTickRects(chart, /^\d+时$/);
    expect(ticks).toHaveLength(24);

    // Labels are CENTERED within their slot, so left-to-left deltas are
    // contaminated by label-width variance ("0时" is narrower than "10时").
    // Center-to-center distance cancels the label-width term and equals
    // the slot width directly.
    const deltas = deltasBetweenCenters(ticks);
    const avgDelta = deltas.reduce((acc, d) => acc + d, 0) / deltas.length;
    const minDelta = Math.min(...deltas);
    const maxDelta = Math.max(...deltas);

    console.warn('chronix day slotWidth:', axis.slotWidth);
    console.warn('k-ui   day slot width (avg, center-to-center):', avgDelta);
    console.warn('k-ui   day slot width (min..max):', `${minDelta}..${maxDelta}`);

    // Uniformity check: ≤ 1px variance from sub-pixel rendering rounding.
    expect(maxDelta - minDelta).toBeLessThanOrEqual(1);

    // The real parity assertion. If this fails, chronix's slot-width
    // derivation in AxisRangePlanner is drifting from the reference.
    expect(Math.abs(avgDelta - axis.slotWidth)).toBeLessThanOrEqual(1);
  });

  /**
   * Slot-width parity for the five non-day views. Each row drives the same
   * pattern as the day-view geometry test:
   *   1. Run chronix's AxisRangePlanner in-process.
   *   2. Switch the k-ui demo to the matching view.
   *   3. Pull rendered tick rects by the view's leaf-label regex.
   *   4. Assert center-to-center spacing is uniform AND matches chronix's
   *      derived slotWidth within 1px.
   *
   * Failures should NOT be silenced by tweaking chronix's derivation — log
   * the discrepancy and bring it to the user. The rendered DOM is the
   * oracle; a mismatch is the parity gap itself.
   *
   * Label regex notes:
   * - week:  hour ticks "0时".."23时" repeat once per day across 7 days
   *   (168 positions); same regex as day-view, dedupe-by-position handles
   *   the repetition.
   * - month / season / halfYear / year: day ticks "DD日<wd>" where <wd> is
   *   one of 一/二/三/四/五/六/日. Day-of-month repeats across months but
   *   each tick has a distinct rounded-left, so dedupe-by-position holds.
   */
  const HOUR_LABEL_RE = /^\d+时$/;
  const DAY_LABEL_RE = /^\d+日[一二三四五六日]$/u;

  const NON_DAY_VIEWS: readonly {
    viewId: ViewId;
    toggleLabel: string;
    labelRegex: RegExp;
  }[] = [
    { viewId: 'week', toggleLabel: '周', labelRegex: HOUR_LABEL_RE },
    { viewId: 'month', toggleLabel: '月', labelRegex: DAY_LABEL_RE },
    { viewId: 'season', toggleLabel: '季', labelRegex: DAY_LABEL_RE },
    { viewId: 'halfYear', toggleLabel: '半年', labelRegex: DAY_LABEL_RE },
    { viewId: 'year', toggleLabel: '年', labelRegex: DAY_LABEL_RE },
  ];

  for (const { viewId, toggleLabel, labelRegex } of NON_DAY_VIEWS) {
    test(`${viewId}-view slot width (chronix slotWidth vs k-ui rendered spacing)`, async ({
      page,
    }) => {
      const axis = defaultAxisRangePlanner.plan({
        viewId,
        anchorDate: new Date(FROZEN_TIME_ISO),
        viewportWidth: VIEWPORT.width,
        locale: 'zh-CN',
        weekendsVisible: true,
      });
      const chart = await loadView(page, toggleLabel);
      const ticks = await extractRenderedTickRects(chart, labelRegex);

      // Sanity: chronix plans `axis.slotCount` ticks; k-ui should render
      // at least 2 so we can compute one delta. Most views render all of
      // them — half-year/year may scroll some off-screen but SVG <text>
      // bounding rects are reported even when outside the visible chart.
      expect(ticks.length).toBeGreaterThanOrEqual(2);

      const deltas = deltasBetweenCenters(ticks);
      const avgDelta = deltas.reduce((acc, d) => acc + d, 0) / deltas.length;
      const minDelta = Math.min(...deltas);
      const maxDelta = Math.max(...deltas);

      console.warn(`chronix ${viewId} slotWidth:`, axis.slotWidth, `(slotCount=${axis.slotCount})`);
      console.warn(
        `k-ui   ${viewId} slot width (avg, center-to-center):`,
        avgDelta,
        `(n=${ticks.length})`,
      );
      console.warn(`k-ui   ${viewId} slot width (min..max):`, `${minDelta}..${maxDelta}`);

      expect(maxDelta - minDelta).toBeLessThanOrEqual(1);
      expect(Math.abs(avgDelta - axis.slotWidth)).toBeLessThanOrEqual(1);
    });
  }

  /**
   * Bar placement parity (day view). For every event the demo renders into
   * the DOM, run chronix `BarPlacementPass` over the same event set and
   * assert `(x, width)` agree within 1px. Y is excluded for v0 — chronix's
   * `RowSwimlaneLayout` doesn't model the demo's resource-tree grouping,
   * so Y parity requires Phase 2.x row-tree work.
   *
   * The events are replicated locally (rather than introspected from the
   * page) because the demo's date math runs at module-load via
   * `new Date()` — under Playwright clock-install both Node and the
   * browser see the same epoch, so `today = startOfLocalDay(FROZEN_TIME)`
   * computes identically on both sides as long as Node and the browser
   * share a timezone (which they do — Playwright inherits system TZ).
   */
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const MS_PER_HOUR = 60 * 60 * 1000;

  /**
   * Returns ms epoch for `today + dayOffset days + hour:minute`, where
   * `today` is local midnight of FROZEN_TIME_ISO. Mirrors the demo's
   * `formatDateTime(addDays(today, N), H, M)` chain at the epoch level —
   * avoids the YYYY-MM-DD HH:mm:ss string roundtrip that would re-parse
   * through `new Date(...)` and pick up the local TZ a second time.
   */
  function eventEpoch(todayMs: number, dayOffset: number, hour: number, minute = 0): number {
    return todayMs + dayOffset * MS_PER_DAY + hour * MS_PER_HOUR + minute * 60 * 1000;
  }

  /** Replicates the demo's `generateTestEvents()` — 25 events. Keeps id, resourceId, and time only. */
  function buildTestEvents(todayMs: number) {
    const E = (
      id: string,
      resourceId: string,
      sd: number,
      sh: number,
      ed: number,
      eh: number,
      sm = 0,
      em = 0,
    ) => ({
      id,
      resourceId,
      startMs: eventEpoch(todayMs, sd, sh, sm),
      endMs: eventEpoch(todayMs, ed, eh, em),
    });
    return [
      E('event-1', '32', -5, 8, -2, 18),
      E('event-2', '25', -3, 9, +1, 17),
      E('event-3', '25', +2, 8, +5, 16),
      E('event-4', '16', -2, 10, +2, 15),
      E('event-5', '16', +3, 9, +7, 17),
      E('event-6', '19', -7, 8, -3, 18),
      E('event-7', '19', -1, 9, +10, 16),
      E('event-8', '20', 0, 8, +5, 18),
      E('event-9', '18', +1, 10, +7, 15),
      E('event-10', '21', -5, 8, +3, 18),
      E('event-11', '21', +4, 9, +14, 17),
      E('event-12', '33', -3, 8, +5, 18),
      E('event-13', '3', -2, 9, +7, 16),
      E('event-14', '3', +8, 8, +20, 17),
      E('event-15', '4', 0, 10, +5, 15),
      E('event-16', '2', +1, 9, +10, 16),
      E('event-17', '8', -1, 8, +7, 18),
      E('event-18', '9', +3, 10, +14, 17),
      E('event-19', '9', +15, 9, +30, 16),
      E('event-20', '28', -1, 14, +2, 20),
      E('event-21', '10', 0, 13, +3, 19),
      E('event-22', '31', -7, 8, +20, 18),
      E('event-23', '11', -5, 9, +25, 17),
      E('event-24', '27', +5, 8, +14, 16),
      E('event-25', '12', +15, 9, +30, 17),
    ];
  }

  test('day-view bar placement (x + width per event-id)', async ({ page }) => {
    // Step 1: compute `today` (local midnight of FROZEN_TIME_ISO) in Node.
    // The browser does `today = new Date(); today.setHours(0,0,0,0)` after
    // clock-install — same arithmetic, so todayMs is shared.
    const today = new Date(FROZEN_TIME_ISO);
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    const events = buildTestEvents(todayMs);

    // Step 2: chronix pipeline. Strips are dummy — we only assert x/width.
    const axis = defaultAxisRangePlanner.plan({
      viewId: 'day',
      anchorDate: new Date(FROZEN_TIME_ISO),
      viewportWidth: VIEWPORT.width,
      locale: 'zh-CN',
      weekendsVisible: true,
    });
    const uniqueRowIds = [...new Set(events.map((e) => e.resourceId))];
    const rows: RowSpec[] = uniqueRowIds.map((id) => ({ id, columns: {} }));
    const { strips } = defaultRowSwimlaneLayout.layout({ rows, defaultRowHeight: 30 });
    const bars: BarSpec[] = events.map((e) => ({
      id: e.id,
      rowId: e.resourceId,
      range: { start: new Date(e.startMs), end: new Date(e.endMs) },
      dprIntent: 'crisp-pixel',
    }));
    const { placedBars } = defaultBarPlacementPass.place({ bars, axis, strips });
    const chronixByEventId = new Map(placedBars.map((p) => [p.barId, p]));

    // Step 3: drive k-ui to day view, extract every bar's (x, width)
    // relative to the timeline-body-wrapper origin.
    const chart = await loadDayView(page);
    const domBars = await chart.evaluate(() => {
      const wrapper = document.querySelector('.gantt-timeline-body-wrapper');
      const wrapperLeft = wrapper ? wrapper.getBoundingClientRect().left : 0;
      const out: { eventId: string; x: number; width: number }[] = [];
      document.querySelectorAll<SVGElement>('[data-event-id]').forEach((el) => {
        const eventId = el.getAttribute('data-event-id') ?? '';
        const r = el.getBoundingClientRect();
        out.push({
          eventId,
          x: Math.round((r.left - wrapperLeft) * 100) / 100,
          width: Math.round(r.width * 100) / 100,
        });
      });
      // Dedupe by eventId — the SVG layer renders the bar plus optional
      // overlays (progress triangle etc.) all with `[data-event-id]`. Keep
      // the widest hit per id (the bar itself, not a 12px triangle handle).
      const widest = new Map<string, { eventId: string; x: number; width: number }>();
      for (const b of out) {
        const prev = widest.get(b.eventId);
        if (!prev || b.width > prev.width) widest.set(b.eventId, b);
      }
      return [...widest.values()];
    });

    // Step 4: per-id parity assertion. Skip ids that exist on only one side
    // (chronix produces a placement for every input event; k-ui may omit
    // some that fall entirely outside the visible chart, depending on its
    // rendering policy — we want to fail loudly only when ids on BOTH
    // sides disagree).
    let comparedCount = 0;
    const failures: string[] = [];
    for (const dom of domBars) {
      const chronix = chronixByEventId.get(dom.eventId);
      if (!chronix) continue;
      comparedCount += 1;
      const xDelta = Math.abs(chronix.x - dom.x);
      const wDelta = Math.abs(chronix.width - dom.width);
      if (xDelta > 1 || wDelta > 1) {
        failures.push(
          `${dom.eventId}: chronix=(${chronix.x},${chronix.width}) dom=(${dom.x},${dom.width}) Δx=${xDelta} Δw=${wDelta}`,
        );
      }
    }

    console.warn(
      `bar-placement parity: compared ${comparedCount}/${domBars.length} events (chronix produced ${placedBars.length})`,
    );
    if (failures.length) {
      console.warn('bar-placement parity failures:');
      for (const f of failures) console.warn(`  ${f}`);
    }
    expect(comparedCount).toBeGreaterThan(0);
    expect(failures).toEqual([]);
  });
});
