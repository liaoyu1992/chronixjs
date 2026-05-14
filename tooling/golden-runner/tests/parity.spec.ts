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
 * Pull rendered tick rects from the reference chart DOM. Matches leaves
 * whose text passes `labelRegex`, then walks up to the first ancestor with
 * non-zero rendered width — the reference wraps each label as
 * `<text><title>N时</title></text>` and the `<title>` is a 0×0 SVG tooltip
 * element, not the visible label.
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
 * chronix-vs-reference parity assertions. Each test compares one observable
 * chronix output (a layout pass result) against what the reference demo
 * actually renders into the DOM. Failures are interesting, not noise — the
 * diff IS the parity gap.
 */
test.describe('parity: chronix vs reference demo', () => {
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

    const refLabels = await chart.evaluate((root) => {
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

    console.warn('chronix   day-view labels:', chronixLabels);
    console.warn('reference day-view labels:', refLabels);

    expect(chronixLabels).toHaveLength(24);
    expect(refLabels.length).toBeGreaterThan(0);
    expect(new Set(refLabels)).toEqual(new Set(chronixLabels));
  });

  test('day-view slot width (chronix slotWidth vs reference rendered spacing)', async ({
    page,
  }) => {
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

    console.warn('chronix   day slotWidth:', axis.slotWidth);
    console.warn('reference day slot width (avg, center-to-center):', avgDelta);
    console.warn('reference day slot width (min..max):', `${minDelta}..${maxDelta}`);

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
   *   2. Switch the reference demo to the matching view.
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
    test(`${viewId}-view slot width (chronix slotWidth vs reference rendered spacing)`, async ({
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

      // Sanity: chronix plans `axis.slotCount` ticks; the reference should
      // render at least 2 so we can compute one delta. Most views render
      // all of them — half-year/year may scroll some off-screen but SVG
      // <text> bounding rects are reported even when outside the visible
      // chart.
      expect(ticks.length).toBeGreaterThanOrEqual(2);

      const deltas = deltasBetweenCenters(ticks);
      const avgDelta = deltas.reduce((acc, d) => acc + d, 0) / deltas.length;
      const minDelta = Math.min(...deltas);
      const maxDelta = Math.max(...deltas);

      console.warn(
        `chronix   ${viewId} slotWidth:`,
        axis.slotWidth,
        `(slotCount=${axis.slotCount})`,
      );
      console.warn(
        `reference ${viewId} slot width (avg, center-to-center):`,
        avgDelta,
        `(n=${ticks.length})`,
      );
      console.warn(`reference ${viewId} slot width (min..max):`, `${minDelta}..${maxDelta}`);

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

  test('day-view bar placement (x + y + width per event-id)', async ({ page }) => {
    // Step 1: compute `today` (local midnight of FROZEN_TIME_ISO) in Node.
    // The browser does `today = new Date(); today.setHours(0,0,0,0)` after
    // clock-install — same arithmetic, so todayMs is shared.
    const today = new Date(FROZEN_TIME_ISO);
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    const events = buildTestEvents(todayMs);

    const chart = await loadDayView(page);

    // Step 2: probe the reference rendered row layout. The body has one
    // strip per leaf resource, contiguous, with heights driven by the
    // reference's event-stack math (`eventMinHeight + stacking-adjusted
    // padding`). Chronix v0 doesn't model the stacking, but
    // RowSwimlaneLayout accepts an explicit `heightHint` per row, so
    // passing the probed heights forward pins the swimlane to the
    // reference geometry. The first row's top relative to the body
    // wrapper is also captured — the reference body has ~0.5px of
    // internal border / wrapper padding before the first lane.
    const domRows = await chart.evaluate(() => {
      const wrapper = document.querySelector('.gantt-timeline-body-wrapper');
      const wrapperTop = wrapper ? wrapper.getBoundingClientRect().top : 0;
      // Use the resource-panel TR rows as the lane source — every leaf
      // resource has one, in render order. Body has no per-row container
      // with data-resource-id, but the panel's row top mirrors the body's
      // strip top because the two sync via the scroller's vertical layout.
      const rows = Array.from(
        document.querySelectorAll<HTMLTableRowElement>('tr[data-resource-id]'),
      );
      const seen = new Set<string>();
      const out: { resourceId: string; y: number; height: number }[] = [];
      for (const tr of rows) {
        const id = tr.getAttribute('data-resource-id') ?? '';
        if (seen.has(id)) continue;
        seen.add(id);
        const r = tr.getBoundingClientRect();
        out.push({
          resourceId: id,
          y: Math.round((r.top - wrapperTop) * 100) / 100,
          height: Math.round(r.height * 100) / 100,
        });
      }
      out.sort((a, b) => a.y - b.y);
      return out;
    });

    // The first row's top edge — chronix's strip[0].y is 0 by contract,
    // and the body has a ~0.5px wrapper offset before the lanes start.
    const wrapperRowOffsetY = domRows[0]?.y ?? 0;

    // Reference empirical body-layout constants. The reference timeline
    // view uses a per-slot-width pass (the slot-width parity tests above
    // already lock that in); Y is driven by an `eventMinHeight` + first-
    // event-top-padding config pair (the demo sets eventMinHeight=30 and
    // the top padding empirically resolves to 8px for un-stacked rows).
    const BAR_HEIGHT = 30;
    const BAR_TOP_PADDING = 8;

    // Step 3: chronix pipeline using probed row heights so the swimlane
    // matches the reference's stacked geometry.
    const axis = defaultAxisRangePlanner.plan({
      viewId: 'day',
      anchorDate: new Date(FROZEN_TIME_ISO),
      viewportWidth: VIEWPORT.width,
      locale: 'zh-CN',
      weekendsVisible: true,
    });
    const rows: RowSpec[] = domRows.map((r) => ({
      id: r.resourceId,
      columns: {},
      heightHint: r.height,
    }));
    const { strips } = defaultRowSwimlaneLayout.layout({ rows, defaultRowHeight: 39 });
    const bars: BarSpec[] = events.map((e) => ({
      id: e.id,
      rowId: e.resourceId,
      range: { start: new Date(e.startMs), end: new Date(e.endMs) },
      dprIntent: 'crisp-pixel',
    }));
    const { placedBars } = defaultBarPlacementPass.place({
      bars,
      axis,
      strips,
      barVerticalPadding: BAR_TOP_PADDING,
      barHeight: BAR_HEIGHT,
    });
    const chronixByEventId = new Map(placedBars.map((p) => [p.barId, p]));

    // Step 4: extract every bar's (x, y, width) from the DOM relative to
    // the timeline-body-wrapper origin.
    const domBars = await chart.evaluate(() => {
      const wrapper = document.querySelector('.gantt-timeline-body-wrapper');
      const wrapperLeft = wrapper ? wrapper.getBoundingClientRect().left : 0;
      const wrapperTop = wrapper ? wrapper.getBoundingClientRect().top : 0;
      const out: { eventId: string; x: number; y: number; width: number; height: number }[] = [];
      document.querySelectorAll<SVGElement>('[data-event-id]').forEach((el) => {
        const eventId = el.getAttribute('data-event-id') ?? '';
        const r = el.getBoundingClientRect();
        // Skip thin overlay handles (progress triangle is ~8px tall).
        if (r.height < 4) return;
        out.push({
          eventId,
          x: Math.round((r.left - wrapperLeft) * 100) / 100,
          y: Math.round((r.top - wrapperTop) * 100) / 100,
          width: Math.round(r.width * 100) / 100,
          height: Math.round(r.height * 100) / 100,
        });
      });
      // Dedupe by eventId, widest wins (filters any non-handle overlays).
      const widest = new Map<string, (typeof out)[number]>();
      for (const b of out) {
        const prev = widest.get(b.eventId);
        if (!prev || b.width > prev.width) widest.set(b.eventId, b);
      }
      return [...widest.values()];
    });

    // Step 5: per-id parity assertion. Skip ids that exist on only one
    // side — chronix produces a placement for every input event; the
    // reference may omit some that fall entirely outside the visible
    // chart. Only assert on the intersection.
    let comparedCount = 0;
    const failures: string[] = [];
    for (const dom of domBars) {
      const chronix = chronixByEventId.get(dom.eventId);
      if (!chronix) continue;
      comparedCount += 1;
      const xDelta = Math.abs(chronix.x - dom.x);
      const wDelta = Math.abs(chronix.width - dom.width);
      // Chronix's strip[0].y starts at 0; DOM's first lane is offset by
      // ~0.5px from the body wrapper. Subtract that to compare.
      const yDelta = Math.abs(chronix.y + wrapperRowOffsetY - dom.y);
      if (xDelta > 1 || yDelta > 1 || wDelta > 1) {
        failures.push(
          `${dom.eventId}: chronix=(${chronix.x},${chronix.y},${chronix.width}) dom=(${dom.x},${dom.y},${dom.width}) Δx=${xDelta} Δy=${yDelta} Δw=${wDelta}`,
        );
      }
    }

    console.warn(
      `bar-placement parity: compared ${comparedCount}/${domBars.length} events (chronix produced ${placedBars.length}); wrapperRowOffsetY=${wrapperRowOffsetY}`,
    );
    if (failures.length) {
      console.warn('bar-placement parity failures:');
      for (const f of failures) console.warn(`  ${f}`);
    }
    expect(comparedCount).toBeGreaterThan(0);
    expect(failures).toEqual([]);
  });
});
