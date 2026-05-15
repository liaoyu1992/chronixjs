import {
  defaultAxisRangePlanner,
  defaultBarPlacementPass,
  defaultBarStackHeightPass,
  defaultRowSwimlaneLayout,
} from '@chronixjs/gantt';
import { expect, test } from '@playwright/test';

import { CHART_SELECTOR, FROZEN_TIME_ISO, VIEWPORT } from '../src/config.js';
import { REF_ATTR_NAMES, RESOURCE_ROW, TIMELINE_BODY_WRAPPER } from '../src/reference-dom-map.js';

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

  /**
   * Tick-label set-equality for every day-resolution view. All four use
   * `planMonthBandedAxis` (or `planMonthView` for the single-month case),
   * which emits `"DD日<wd>"` with narrow zh-CN weekday — matching the
   * reference DOM character-for-character. Set-equality is a sharp
   * detector of cross-month boundary bugs: if chronix were off by one day
   * (e.g. emitting Mar 1 twice and skipping Feb 28), the chronix set
   * would diverge from the rendered set even at the same `slotCount`.
   *
   * Year view typically dedupes to ~217 unique "DD日X" strings (31 days ×
   * 7 weekdays, minus combinations that never occur in the calendar
   * year). Smaller views have correspondingly smaller unique sets.
   */
  const DAY_RESOLUTION_VIEWS: readonly {
    readonly viewId: ViewId;
    readonly toggleLabel: string;
  }[] = [
    { viewId: 'month', toggleLabel: '月' },
    { viewId: 'season', toggleLabel: '季' },
    { viewId: 'halfYear', toggleLabel: '半年' },
    { viewId: 'year', toggleLabel: '年' },
  ];

  /**
   * Week-view outer header cells. chronix `planWeekView` emits one cell
   * per day with the format `<month>/<day><weekday-short>` (e.g.
   * `"5/13周三"` via `Intl.DateTimeFormat('zh-CN', { weekday: 'short',
   * month: 'numeric', day: 'numeric' })`).
   *
   * The reference's outer-cell format is unverified — this parity check
   * makes any divergence visible. If chronix and the reference render
   * different formats, the test fails with the diff in the diagnostic
   * console.warn (left- and right-side sets logged).
   */
  test('week-view header cells (set equality)', async ({ page }) => {
    const axis = defaultAxisRangePlanner.plan({
      viewId: 'week',
      anchorDate: new Date(FROZEN_TIME_ISO),
      viewportWidth: VIEWPORT.width,
      locale: 'zh-CN',
      weekendsVisible: true,
    });
    const chronixLabels = axis.headerRows[0]?.cells.map((c) => c.label) ?? [];
    const chart = await loadView(page, '周');

    const refLabels = await chart.evaluate((root) => {
      const result: string[] = [];
      const seen = new Set<string>();
      // chronix format `"<M>/<D>周<wd>"`. Permissive regex matches any
      // leaf text that has the digit/slash/digit anchor and ends with a
      // CJK weekday — captures the reference even if the surrounding
      // punctuation differs.
      const re = /^\d+\/\d+周[一二三四五六日]$/u;
      root.querySelectorAll('*').forEach((node) => {
        if (node.children.length > 0) return;
        const txt = node.textContent?.trim() ?? '';
        if (re.test(txt) && !seen.has(txt)) {
          seen.add(txt);
          result.push(txt);
        }
      });
      return result;
    });

    console.warn('chronix   week-view header cells:', chronixLabels);
    console.warn('reference week-view header cells:', refLabels);

    expect(chronixLabels).toHaveLength(7);
    expect(refLabels.length).toBeGreaterThan(0);
    expect(new Set(refLabels)).toEqual(new Set(chronixLabels));
  });

  /**
   * Outer monthFmt cell label across the four day-resolution views.
   * chronix emits `"YYYY年M月"` via `Intl.DateTimeFormat('zh-CN', {
   * year: 'numeric', month: 'long' })`. month view has 1 outer cell;
   * season / halfYear / year have N month cells (3 / 6 / 12).
   *
   * Like the week-view test above, this surfaces any reference-side
   * format divergence rather than asserting a specific one.
   */
  /**
   * Header-row label format differs by view. `planMonthView` (single
   * month) emits `"YYYY年M月"`; `planMonthBandedAxis` (season /
   * halfYear / year, multiple parallel months) emits short month names
   * (`"五月"`, `"六月"`, …) — see Phase 4.9 for the alignment rationale.
   */
  const MONTH_FMT_RE_BY_VIEW: Record<string, RegExp> = {
    month: /^\d+年\d+月$/u,
    season: /^[一二三四五六七八九十]+月$/u,
    halfYear: /^[一二三四五六七八九十]+月$/u,
    year: /^[一二三四五六七八九十]+月$/u,
  };

  for (const { viewId, toggleLabel } of DAY_RESOLUTION_VIEWS) {
    test(`${viewId}-view header-row monthFmt cells (set equality)`, async ({ page }) => {
      const axis = defaultAxisRangePlanner.plan({
        viewId,
        anchorDate: new Date(FROZEN_TIME_ISO),
        viewportWidth: VIEWPORT.width,
        locale: 'zh-CN',
        weekendsVisible: true,
      });
      const chronixLabels = axis.headerRows[0]?.cells.map((c) => c.label) ?? [];
      const chart = await loadView(page, toggleLabel);

      const re = MONTH_FMT_RE_BY_VIEW[viewId]!;
      const refLabels = await chart.evaluate(
        (_root, { regexSource, regexFlags }) => {
          const r = new RegExp(regexSource, regexFlags);
          const result: string[] = [];
          const seen = new Set<string>();
          document.querySelectorAll('*').forEach((node) => {
            if (node.children.length > 0) return;
            const txt = node.textContent?.trim() ?? '';
            if (r.test(txt) && !seen.has(txt)) {
              seen.add(txt);
              result.push(txt);
            }
          });
          return result;
        },
        { regexSource: re.source, regexFlags: re.flags },
      );

      console.warn(`chronix   ${viewId} header cells:`, chronixLabels);
      console.warn(`reference ${viewId} header cells:`, refLabels);

      const expectedCount =
        viewId === 'month' ? 1 : viewId === 'season' ? 3 : viewId === 'halfYear' ? 6 : 12;
      expect(chronixLabels).toHaveLength(expectedCount);
      expect(refLabels.length).toBeGreaterThan(0);
      expect(new Set(refLabels)).toEqual(new Set(chronixLabels));
    });
  }

  for (const { viewId, toggleLabel } of DAY_RESOLUTION_VIEWS) {
    test(`${viewId}-view tick labels (set equality)`, async ({ page }) => {
      const axis = defaultAxisRangePlanner.plan({
        viewId,
        anchorDate: new Date(FROZEN_TIME_ISO),
        viewportWidth: VIEWPORT.width,
        locale: 'zh-CN',
        weekendsVisible: true,
      });
      const chronixLabels = axis.ticks.map((t) => t.label);
      const chart = await loadView(page, toggleLabel);

      // Pluck leaf-text nodes matching the day-tick regex (`"DD日<wd>"`).
      // The reference renders one `<text>` per day slot; off-screen days
      // (half-year / year scrolled at range-start) still have their
      // bounding rect in the SVG, so the DOM set holds the full label
      // universe — which should equal chronix's `axis.ticks` label set.
      const refLabels = await chart.evaluate((root) => {
        const result: string[] = [];
        const seen = new Set<string>();
        root.querySelectorAll('*').forEach((node) => {
          if (node.children.length > 0) return;
          const txt = node.textContent?.trim() ?? '';
          if (/^\d+日[一二三四五六日]$/u.test(txt) && !seen.has(txt)) {
            seen.add(txt);
            result.push(txt);
          }
        });
        return result;
      });

      console.warn(
        `chronix   ${viewId}-view labels (count=${chronixLabels.length}, unique=${new Set(chronixLabels).size})`,
      );
      console.warn(`reference ${viewId}-view labels (unique=${refLabels.length})`);

      expect(chronixLabels.length).toBeGreaterThan(0);
      expect(refLabels.length).toBeGreaterThan(0);
      expect(new Set(refLabels)).toEqual(new Set(chronixLabels));
    });
  }

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

  /**
   * Drive the chronix layout pipeline + reference DOM extraction for one
   * view, then compare per-event-id (x, y, width). Returns the
   * intersection-size and failure list so the calling test can assert
   * over them (allows per-view test reporting in Playwright). Extracted
   * from the original day-view test so all six views can share the body.
   */
  async function runBarPlacementParity(page: Page, viewId: ViewId, viewToggleLabel: string) {
    // Step 1: compute `today` (local midnight of FROZEN_TIME_ISO) in Node.
    // The browser does `today = new Date(); today.setHours(0,0,0,0)` after
    // clock-install — same arithmetic, so todayMs is shared.
    const today = new Date(FROZEN_TIME_ISO);
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    const events = buildTestEvents(todayMs);

    const chart = await loadView(page, viewToggleLabel);

    // Step 2: probe the reference rendered row ORDER. The body has one
    // strip per leaf resource, contiguous, in render order — but that
    // order DIFFERS from the demo's source `RESOURCES[]` list because
    // the reference groups resources by baseName internally. Chronix
    // doesn't have a tree-aware row-ordering pass yet, so the test
    // reads the order off the DOM and feeds it to chronix verbatim.
    // (Heights are NO LONGER probed here — `BarStackHeightPass`
    // computes them from the same bar set, closing the cheat.)
    const renderedRowOrder = await chart.evaluate(
      (_root, { wrapperSel, rowSel, resourceIdAttr }) => {
        const wrapper = document.querySelector(wrapperSel);
        const wrapperTop = wrapper ? wrapper.getBoundingClientRect().top : 0;
        const trs = Array.from(document.querySelectorAll<HTMLTableRowElement>(rowSel));
        const seen = new Set<string>();
        const ordered: { resourceId: string; y: number }[] = [];
        for (const tr of trs) {
          const id = tr.getAttribute(resourceIdAttr) ?? '';
          if (seen.has(id)) continue;
          seen.add(id);
          ordered.push({
            resourceId: id,
            y: Math.round((tr.getBoundingClientRect().top - wrapperTop) * 100) / 100,
          });
        }
        ordered.sort((a, b) => a.y - b.y);
        return {
          wrapperOffsetY: ordered[0]?.y ?? 0,
          resourceIds: ordered.map((r) => r.resourceId),
        };
      },
      {
        wrapperSel: TIMELINE_BODY_WRAPPER,
        rowSel: RESOURCE_ROW,
        resourceIdAttr: REF_ATTR_NAMES.resourceId,
      },
    );
    const wrapperRowOffsetY = renderedRowOrder.wrapperOffsetY;

    // Body-layout constants — match the demo's options exactly so chronix
    // produces the same logical geometry: eventMinHeight=30, eventSpacing=10,
    // resourceFirstEventTopPadding=8, bottom padding=4. The +1px CSS row
    // border between rendered TR strips lands in RowSwimlaneLayout's
    // `rowSpacing` so chronix's cumulative Y matches the layout-flow.
    const BAR_HEIGHT = 30;
    const BAR_STACK_SPACING = 10;
    const BAR_TOP_PADDING = 8;
    const BAR_BOTTOM_PADDING = 4;
    const ROW_BORDER_PX = 1;

    // Step 3: chronix pipeline. Order rows by the rendered sequence,
    // derive heights from the event stack, lay out swimlanes (with the
    // 1px row-border accounted for), and place each bar.
    const axis = defaultAxisRangePlanner.plan({
      viewId,
      anchorDate: new Date(FROZEN_TIME_ISO),
      viewportWidth: VIEWPORT.width,
      locale: 'zh-CN',
      weekendsVisible: true,
    });
    const bars: BarSpec[] = events.map((e) => ({
      id: e.id,
      rowId: e.resourceId,
      range: { start: new Date(e.startMs), end: new Date(e.endMs) },
      dprIntent: 'crisp-pixel',
    }));
    const rowsNoHeight: RowSpec[] = renderedRowOrder.resourceIds.map((id) => ({
      id,
      columns: {},
    }));
    const { heightByRowId } = defaultBarStackHeightPass.compute({
      bars,
      rows: rowsNoHeight,
      axis,
      barHeight: BAR_HEIGHT,
      barStackSpacing: BAR_STACK_SPACING,
      firstBarTopPadding: BAR_TOP_PADDING,
      lastBarBottomPadding: BAR_BOTTOM_PADDING,
    });
    // BarStackHeightPass guarantees an entry per input row, but `Map.get`
    // is typed as `T | undefined` so spread the field conditionally —
    // `exactOptionalPropertyTypes` rejects `heightHint: undefined`.
    const rows: RowSpec[] = rowsNoHeight.map((r) => {
      const h = heightByRowId.get(r.id);
      return h === undefined ? r : { ...r, heightHint: h };
    });
    const { strips } = defaultRowSwimlaneLayout.layout({
      rows,
      defaultRowHeight: BAR_HEIGHT + BAR_TOP_PADDING,
      rowSpacing: ROW_BORDER_PX,
    });
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
    const domBars = await chart.evaluate(
      (_root, { wrapperSel, eventIdAttr }) => {
        const wrapper = document.querySelector(wrapperSel);
        const wrapperLeft = wrapper ? wrapper.getBoundingClientRect().left : 0;
        const wrapperTop = wrapper ? wrapper.getBoundingClientRect().top : 0;
        const out: { eventId: string; x: number; y: number; width: number; height: number }[] = [];
        document.querySelectorAll<SVGElement>(`[${eventIdAttr}]`).forEach((el) => {
          const eventId = el.getAttribute(eventIdAttr) ?? '';
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
      },
      { wrapperSel: TIMELINE_BODY_WRAPPER, eventIdAttr: REF_ATTR_NAMES.eventId },
    );

    // Step 5: per-id parity diff. Skip ids that exist on only one side —
    // chronix produces a placement for every input event; the reference
    // may omit some that fall entirely outside the visible chart. Only
    // diff the intersection.
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

    return {
      viewId,
      comparedCount,
      failures,
      totalDomBars: domBars.length,
      totalChronixBars: placedBars.length,
      wrapperRowOffsetY,
    };
  }

  function assertBarPlacementParity(result: Awaited<ReturnType<typeof runBarPlacementParity>>) {
    console.warn(
      `${result.viewId}-view bar-placement parity: compared ${result.comparedCount}/${result.totalDomBars} events (chronix produced ${result.totalChronixBars}); wrapperRowOffsetY=${result.wrapperRowOffsetY}`,
    );
    if (result.failures.length) {
      console.warn(`${result.viewId}-view bar-placement parity failures:`);
      for (const f of result.failures) console.warn(`  ${f}`);
    }
    expect(result.comparedCount).toBeGreaterThan(0);
    expect(result.failures).toEqual([]);
  }

  test('day-view bar placement (x + y + width per event-id)', async ({ page }) => {
    assertBarPlacementParity(await runBarPlacementParity(page, 'day', '日'));
  });

  test('week-view bar placement (x + y + width per event-id)', async ({ page }) => {
    assertBarPlacementParity(await runBarPlacementParity(page, 'week', '周'));
  });

  test('month-view bar placement (x + y + width per event-id)', async ({ page }) => {
    assertBarPlacementParity(await runBarPlacementParity(page, 'month', '月'));
  });

  test('season-view bar placement (x + y + width per event-id)', async ({ page }) => {
    assertBarPlacementParity(await runBarPlacementParity(page, 'season', '季'));
  });

  test('half-year-view bar placement (x + y + width per event-id)', async ({ page }) => {
    assertBarPlacementParity(await runBarPlacementParity(page, 'halfYear', '半年'));
  });

  test('year-view bar placement (x + y + width per event-id)', async ({ page }) => {
    assertBarPlacementParity(await runBarPlacementParity(page, 'year', '年'));
  });
});
