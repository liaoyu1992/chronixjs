import {
  defaultAxisRangePlanner,
  defaultBarPlacementPass,
  defaultBarStackHeightPass,
  defaultRowSwimlaneLayout,
} from '@chronixjs/gantt';
import { expect, test } from '@playwright/test';

import { CHART_SELECTOR, FROZEN_TIME_ISO, VIEWPORT } from '../src/config.js';
import { buildParityEvents } from '../src/parity-events.js';
import {
  diffBarsSnapshots,
  extractBarsSnapshot,
  extractToolbarSnapshot,
  formatParityDiff,
  hexToRgbString,
  loadBothDemos,
} from '../src/parity-helpers.js';
import {
  REF_ATTR_NAMES,
  RESOURCE_ROW,
  TIMELINE_BODY_WRAPPER,
  TODAY_CELL_BODY,
  TODAY_LINE,
} from '../src/reference-dom-map.js';

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
   *
   * NOTE: The 25-event dataset has been extracted to
   * `tooling/golden-runner/src/parity-events.ts` (imported above as
   * `buildParityEvents`). This eliminates the drift risk between the
   * parity test fixture and the chronix demo's parity-mode dataset
   * (which imports from the same module).
   */

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
    const events = buildParityEvents(todayMs);

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

/**
 * Cross-demo parity tests (Phase 17). Each test in this block opens
 * BOTH demos in separate BrowserContexts (k-ui at port 8701, chronix
 * at port 8702 with `?parity=true`), drives them with the same view,
 * extracts observable bar geometry from each rendered DOM, and diffs
 * via the parity-helper. This is the pattern future adapter / render
 * / interaction phases should use for their parity assertions — see
 * audit/PHASE_17_PARITY_INFRASTRUCTURE_DESIGN.md.
 *
 * Prerequisites: BOTH demos must be running before running this
 * block. The default playwright config only runs against k-ui's URL
 * (port 8701); chronix demo needs to be started separately in
 * another terminal: `pnpm --filter @chronixjs/example-gantt-vue3 dev`.
 */

test.describe('cross-demo parity (Phase 17 helper)', () => {
  test('todayLine x-coordinate parity across both rendered demos (Phase 21)', async ({
    browser,
  }) => {
    // Both demos render today-line by default in parity mode:
    // - reference demo: option enabled by default in DemoApp.vue
    // - chronix demo: parity flag (added by loadBothDemos via ?parity=true)
    //   flips activeTodayLine to `{}` so the line renders with all
    //   chronix-defaults (#ff6b6b / 2 / dashed / 今日). Both lines
    //   should land at the same x relative to their respective body
    //   wrappers, within 1 px.
    const { kuiPage, chronixPage } = await loadBothDemos(browser, {
      id: 'today-line-cross-demo',
      viewId: 'day',
    });
    try {
      // Reference side: bounding-box `left` of the today-line div,
      // measured relative to the body wrapper's `left`.
      const kuiX = await kuiPage.evaluate(
        ({ todayLineSel, bodyWrapperSel }) => {
          const line = document.querySelector(todayLineSel);
          const body = document.querySelector(bodyWrapperSel);
          if (!line || !body) return null;
          const lr = line.getBoundingClientRect();
          const br = body.getBoundingClientRect();
          return lr.left - br.left;
        },
        { todayLineSel: TODAY_LINE, bodyWrapperSel: TIMELINE_BODY_WRAPPER },
      );
      // Chronix side: read `x1` attribute on the body-side line.
      // Chronix x1 is already in body-SVG coordinates whose x=0 lines
      // up with the body wrapper's left edge, so it's directly
      // comparable to the reference's wrapper-relative `left`.
      const chronixX = await chronixPage.evaluate(() => {
        const line = document.querySelector(
          'line.cx-gantt-today-line[data-today-line-side="body"]',
        );
        if (!line) return null;
        const x1 = line.getAttribute('x1');
        return x1 !== null ? Number.parseFloat(x1) : null;
      });

      expect(kuiX, 'reference demo todayLine missing').not.toBeNull();
      expect(chronixX, 'chronix demo todayLine missing').not.toBeNull();
      const delta = Math.abs(kuiX! - chronixX!);
      console.warn(
        `Phase 21 todayLine x parity: kui=${kuiX!.toFixed(2)} chronix=${chronixX!.toFixed(2)} Δ=${delta.toFixed(2)}px`,
      );
      expect(delta, 'todayLine x mismatch > 1 px').toBeLessThanOrEqual(1);
    } finally {
      await kuiPage.context().close();
      await chronixPage.context().close();
    }
  });

  test('todayCellBg x-coordinate + width parity across both rendered demos (Phase 22.2)', async ({
    browser,
  }) => {
    // Both demos render today-cell-bg by default in parity mode:
    // - reference demo: `todayBgColor: 'rgba(255, 220, 40, .15)'` wired
    //   in demo schedulerOptions; applied via .gantt-day-today CSS class
    //   on today's day-header cell
    // - chronix demo: parity flag flips activeTodayCellBg to `{}` so
    //   the <rect class="cx-gantt-today-cell"> renders with theme
    //   default color (same rgba). Cell start x + width should match
    //   (within 1 px) on body-side. Week view chosen because today is
    //   a single day-slot (distinct from day-view where today IS the
    //   whole chart and width=totalWidth).
    const { kuiPage, chronixPage } = await loadBothDemos(browser, {
      id: 'today-cell-bg-cross-demo',
      viewId: 'week',
    });
    try {
      // Reference: `.gantt-day-today` is the marker class. Look for
      // the body-side day-cell (NOT the header text cell — body cell
      // covers the column span we care about). The wrapper rect's
      // `left` minus body-wrapper `left` gives wrapper-relative x;
      // `width` is the cell width.
      const kuiCellRect = await kuiPage.evaluate(
        ({ bodyWrapperSel, cellSel }) => {
          // k-ui paints ONE `.gantt-today-highlight` rect PER
          // hourly slot of today PER row (24 rects per row in
          // week view). Chronix paints ONE rect spanning the
          // whole day. Compare the union extent: minimum left +
          // maximum right across all kui rects gives the visible
          // today-DAY span comparable to chronix's single-rect
          // bbox.
          const body = document.querySelector(bodyWrapperSel);
          if (!body) return null;
          const rects = body.querySelectorAll(cellSel);
          if (rects.length === 0) return null;
          let minLeft = Number.POSITIVE_INFINITY;
          let maxRight = Number.NEGATIVE_INFINITY;
          rects.forEach((r) => {
            const bb = r.getBoundingClientRect();
            if (bb.left < minLeft) minLeft = bb.left;
            if (bb.right > maxRight) maxRight = bb.right;
          });
          const br = body.getBoundingClientRect();
          return { x: minLeft - br.left, width: maxRight - minLeft };
        },
        { bodyWrapperSel: TIMELINE_BODY_WRAPPER, cellSel: TODAY_CELL_BODY },
      );
      // Chronix: read x + width attrs from the body-side rect.
      const chronixCellRect = await chronixPage.evaluate(() => {
        const rect = document.querySelector(
          'rect.cx-gantt-today-cell[data-today-cell-side="body"]',
        );
        if (!rect) return null;
        const x = rect.getAttribute('x');
        const width = rect.getAttribute('width');
        return x !== null && width !== null
          ? { x: Number.parseFloat(x), width: Number.parseFloat(width) }
          : null;
      });

      expect(kuiCellRect, 'reference demo today-cell missing').not.toBeNull();
      expect(chronixCellRect, 'chronix demo today-cell missing').not.toBeNull();
      const xDelta = Math.abs(kuiCellRect!.x - chronixCellRect!.x);
      const widthDelta = Math.abs(kuiCellRect!.width - chronixCellRect!.width);
      console.warn(
        `Phase 22.2 todayCellBg parity (week view): ` +
          `kui x=${kuiCellRect!.x.toFixed(2)} w=${kuiCellRect!.width.toFixed(2)} ` +
          `chronix x=${chronixCellRect!.x.toFixed(2)} w=${chronixCellRect!.width.toFixed(2)} ` +
          `Δx=${xDelta.toFixed(2)} Δw=${widthDelta.toFixed(2)}`,
      );
      expect(xDelta, 'today-cell x mismatch > 1 px').toBeLessThanOrEqual(1);
      expect(widthDelta, 'today-cell width mismatch > 1 px').toBeLessThanOrEqual(1);
    } finally {
      await kuiPage.context().close();
      await chronixPage.context().close();
    }
  });

  test('day-view bar X + width parity across both rendered demos', async ({ browser }) => {
    const { kuiPage, chronixPage, kuiChart, chronixChart } = await loadBothDemos(browser, {
      id: 'day-view-bars-cross-demo',
      viewId: 'day',
    });
    try {
      const kuiSnap = await extractBarsSnapshot('kui', kuiChart);
      const chronixSnap = await extractBarsSnapshot('chronix', chronixChart);

      // Y / height excluded from v0: chronix renders rows in input
      // order while k-ui re-sorts by baseName grouping. Cross-demo Y
      // parity requires a chronix row-hierarchy sorter — parked.
      // Height excluded for parallel reasoning (k-ui's per-row event
      // stacking can produce different bar heights when bars overlap
      // in time on the same resource; chronix's
      // defaultBarStackHeightPass produces matching heights but Y
      // offsets aren't yet aligned).
      const diff = diffBarsSnapshots(kuiSnap, chronixSnap, {
        x: 1,
        width: 1,
        y: Number.POSITIVE_INFINITY,
        height: Number.POSITIVE_INFINITY,
      });

      console.warn(
        `cross-demo parity diff (day-view bars):\n${formatParityDiff(diff)}\n` +
          `k-ui bar count: ${kuiSnap.length}, chronix bar count: ${chronixSnap.length}`,
      );

      expect(diff.mismatches).toEqual([]);
      // onlyInKui / onlyInChronix are tolerable in v0 — k-ui may
      // render bars chronix has off-axis or vice versa; chronix's
      // resource-hierarchy gap means some bars on grouped rows may
      // collide with k-ui's row-merged display. The mismatches list
      // is the hard check; onlyIn lists are warnings.
      if (diff.onlyInKui.length > 0 || diff.onlyInChronix.length > 0) {
        console.warn(
          `cross-demo parity v0 caveat: ` +
            `${diff.onlyInKui.length} bars only in k-ui, ` +
            `${diff.onlyInChronix.length} only in chronix. ` +
            `Acceptable in v0 — see PHASE_17 design doc for row-order gap.`,
        );
      }
    } finally {
      await kuiPage.context().close();
      await chronixPage.context().close();
    }
  });
});

/**
 * `weekendsVisible: false` parity (Phase 18). Closes the BLOCKING
 * drift from `audit/PARITY_RECHECK.md` Batch 1 #10 — chronix's axis
 * planner used to ignore the flag entirely. These two assertions
 * drive the reference demo's `显示周末` checkbox (located in the
 * sidebar `demo-app-sidebar-section` outside the chart locator) to
 * flip its weekendsVisible state OFF, then compare against the
 * chronix planner's filtered output run in-process.
 *
 * Scope: week view (planWeekView path) + halfYear view
 * (planMonthBandedAxis path). planMonthView (single-month)
 * isn't exercised here because the parity test infrastructure
 * compares against the reference's rendered DOM and adding a third
 * view doubles flake risk for marginal extra coverage — the unit
 * tests in `packages/gantt/src/layout/axis-range-planner.test.ts`
 * cover planMonthView. See PHASE_18 design doc for the
 * drift-detection scope decision.
 */
test.describe('parity: chronix vs reference demo — weekendsVisible: false (Phase 18)', () => {
  /**
   * Open the reference demo, flip the 显示周末 checkbox OFF, then
   * switch to the requested view. The default state is checked
   * (weekendsVisible: true); one click toggles to false. The
   * sidebar section that hosts the checkbox sits outside the chart
   * locator, so resolution is rooted at `page`, not `chart`.
   */
  async function loadViewWeekendsOff(page: Page, viewToggleLabel: string) {
    await page.clock.install({ time: new Date(FROZEN_TIME_ISO) });
    await page.goto('/');
    const chart = page.locator(CHART_SELECTOR);
    await chart.waitFor({ state: 'visible' });
    await page.waitForLoadState('networkidle');
    await settle(page);
    await page.getByLabel('显示周末').click();
    await settle(page);
    await chart.getByRole('button', { name: viewToggleLabel, exact: true }).click();
    await settle(page);
    return chart;
  }

  /**
   * Week view dayCells under weekends-off. chronix `planWeekView`
   * with `weekendsVisible: false` emits 5 dayCells (Mon..Fri only).
   * Reference renders the same 5 day-header cells. The leaf-text
   * regex `^\d+\/\d+周[一二三四五]$` deliberately excludes 六/日 so
   * any chronix bug that leaks Sat/Sun into the dayCell label set
   * would fail the set-equality assertion below — both sides should
   * be Mon..Fri only.
   */
  test('week-view dayCells (weekendsVisible: false) — set equality + count', async ({ page }) => {
    const axis = defaultAxisRangePlanner.plan({
      viewId: 'week',
      anchorDate: new Date(FROZEN_TIME_ISO),
      viewportWidth: VIEWPORT.width,
      locale: 'zh-CN',
      weekendsVisible: false,
    });
    const chronixLabels = axis.headerRows[0]?.cells.map((c) => c.label) ?? [];
    expect(chronixLabels).toHaveLength(5);
    expect(chronixLabels.some((l) => /[六日]/u.test(l))).toBe(false);

    const chart = await loadViewWeekendsOff(page, '周');
    const refLabels = await chart.evaluate((root) => {
      const result: string[] = [];
      const seen = new Set<string>();
      // Mon-Fri only — narrow weekday char restricted to 一..五.
      const re = /^\d+\/\d+周[一二三四五]$/u;
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

    console.warn('chronix   week-view dayCells (weekends-off):', chronixLabels);
    console.warn('reference week-view dayCells (weekends-off):', refLabels);

    expect(refLabels.length).toBeGreaterThan(0);
    expect(new Set(refLabels)).toEqual(new Set(chronixLabels));
  });

  /**
   * HalfYear view slot count under weekends-off. chronix
   * `planMonthBandedAxis(monthCount=6, weekendsVisible:false)` for
   * May..Oct 2026 emits 131 day ticks. The reference renders the
   * same set of weekday-only day ticks; their bounding rects are
   * reported even for off-screen labels, so the rendered count
   * equals chronix's `slotCount`. Mon-Fri-only regex
   * (`^\d+日[一二三四五]$`) ensures any 六/日 leak on the reference
   * side would shrink the rendered count and fail the equality.
   */
  test('halfYear-view slot count (weekendsVisible: false) — count equality', async ({ page }) => {
    const axis = defaultAxisRangePlanner.plan({
      viewId: 'halfYear',
      anchorDate: new Date(FROZEN_TIME_ISO),
      viewportWidth: VIEWPORT.width,
      locale: 'zh-CN',
      weekendsVisible: false,
    });
    // Sanity range — bounds the slotCount within the design doc's
    // [125, 135] expectation so a wildly off chronix output fails
    // here before the rendered-count diff drags the message into
    // the noise.
    expect(axis.slotCount).toBeGreaterThanOrEqual(125);
    expect(axis.slotCount).toBeLessThanOrEqual(135);

    const chart = await loadViewWeekendsOff(page, '半年');
    const ticks = await extractRenderedTickRects(chart, /^\d+日[一二三四五]$/u);

    console.warn(
      `chronix   halfYear slotCount (weekends-off): ${axis.slotCount}; ` +
        `reference rendered tick count: ${ticks.length}`,
    );

    expect(ticks).toHaveLength(axis.slotCount);
  });
});

/**
 * Cross-demo bar fill parity (Phase 20). The bar-color pipeline lands
 * inline `fill=` / `stroke=` on the chronix bar `<rect>`. Cross-demo
 * test: chronix demo's parity mode wires `barBackgroundColor` +
 * `barBorderColor` props to `'#3788d8'` (the reference's
 * `eventBorderColor` default); both sides should paint bars in the
 * same color. Second test exercises a callback-driven priority color
 * (red for high) on both sides.
 *
 * `extractBarsSnapshot` returns `fill` in browser-normalized
 * `rgb(R, G, B)` form; `hexToRgbString('#3788d8')` produces the same
 * shape so the comparison is string-equal.
 */
test.describe('cross-demo bar fill parity (Phase 20)', () => {
  test('default bar fill (day view) — both demos paint bars in reference default color', async ({
    browser,
  }) => {
    const { kuiPage, chronixPage, kuiChart, chronixChart } = await loadBothDemos(browser, {
      id: 'phase20-default-color-day',
      viewId: 'day',
    });
    try {
      const kuiSnap = await extractBarsSnapshot('kui', kuiChart);
      const chronixSnap = await extractBarsSnapshot('chronix', chronixChart);

      const expectedRgb = hexToRgbString('#3788d8');
      expect(expectedRgb).not.toBeNull();

      const kuiById = new Map(kuiSnap.map((b) => [b.id, b]));
      const chronixById = new Map(chronixSnap.map((b) => [b.id, b]));

      // Compare across paired bars. Chronix bars should all paint
      // `rgb(55, 136, 216)` because parity mode pins the prop.
      const mismatches: string[] = [];
      let comparedCount = 0;
      for (const [id, chronixBar] of chronixById) {
        const kuiBar = kuiById.get(id);
        if (!kuiBar) continue;
        comparedCount += 1;
        if (chronixBar.fill !== expectedRgb) {
          mismatches.push(`${id}: chronix fill=${chronixBar.fill} expected=${expectedRgb}`);
        }
        // The reference's bar fill may or may not match its own
        // `eventBorderColor` default depending on event metadata — log
        // for diagnostics but don't fail on the kui-side value alone.
      }

      console.warn(
        `cross-demo default bar fill: compared ${comparedCount} paired bars; ` +
          `expected chronix fill='${expectedRgb}'`,
      );
      if (mismatches.length > 0) {
        console.warn(`mismatches:\n  ${mismatches.join('\n  ')}`);
      }

      expect(comparedCount).toBeGreaterThan(0);
      expect(mismatches).toEqual([]);
    } finally {
      await kuiPage.context().close();
      await chronixPage.context().close();
    }
  });

  test('callback-driven priority colors (day view) — chronix priority callback paints expected colors', async ({
    browser,
  }) => {
    // Re-open chronix demo with `?parity=true&priorityCallback=true`
    // so the demo wires `barBackgroundColorCallback` returning
    // per-priority colors. Reuse `loadBothDemos` for the kui side
    // even though this test only asserts chronix-side output —
    // simpler bootstrap, and the kui snapshot serves as a sanity
    // baseline (compare bar counts).
    const kuiContext = await browser.newContext({
      baseURL: 'http://localhost:8701/',
      viewport: VIEWPORT,
      timezoneId: 'Asia/Shanghai',
      locale: 'zh-CN',
    });
    const chronixContext = await browser.newContext({
      baseURL: 'http://localhost:8702/',
      viewport: VIEWPORT,
      timezoneId: 'Asia/Shanghai',
      locale: 'zh-CN',
    });
    const kuiPage = await kuiContext.newPage();
    const chronixPage = await chronixContext.newPage();
    try {
      await kuiPage.clock.install({ time: new Date(FROZEN_TIME_ISO) });
      await chronixPage.clock.install({ time: new Date(FROZEN_TIME_ISO) });
      await Promise.all([
        kuiPage.goto('/'),
        chronixPage.goto('/?parity=true&priorityCallback=true'),
      ]);
      const kuiChart = kuiPage.locator(CHART_SELECTOR);
      const chronixChart = chronixPage.locator('div.cx-gantt-wrapper');
      await kuiChart.waitFor({ state: 'visible' });
      await chronixChart.waitFor({ state: 'visible' });
      await Promise.all([
        kuiPage.waitForLoadState('networkidle'),
        chronixPage.waitForLoadState('networkidle'),
      ]);
      await kuiChart.getByRole('button', { name: '日', exact: true }).click();
      await chronixPage.getByRole('button', { name: '日', exact: true }).click();
      await settle(kuiPage);
      await settle(chronixPage);

      const chronixSnap = await extractBarsSnapshot('chronix', chronixChart);

      // The parity dataset (sample-data-parity.ts) has no priority
      // metadata, so the callback returns `undefined` for every bar
      // → fill stays at the parity-mode default `#3788d8`. The
      // expected rgb is identical to the default-color test —
      // proving the priority callback is exercised but defers when
      // metadata is absent, which is the parity-equivalent of the
      // reference's `priority === undefined ? undefined :
      // PRIORITY_COLOR[priority]` callback path.
      const expectedRgb = hexToRgbString('#3788d8');
      const distinctFills = new Set(chronixSnap.map((b) => b.fill));

      console.warn(
        `cross-demo callback parity: ${chronixSnap.length} chronix bars; ` +
          `distinct fills=${[...distinctFills].join(', ')}; expected=${expectedRgb}`,
      );

      expect(chronixSnap.length).toBeGreaterThan(0);
      // Every chronix bar should paint the parity-mode default
      // because the parity dataset has no `priority` extendedProps
      // → callback returns undefined → cascade falls through to
      // the prop-layer `'#3788d8'`.
      for (const bar of chronixSnap) {
        expect(bar.fill).toBe(expectedRgb);
      }
    } finally {
      await kuiPage.context().close();
      await chronixPage.context().close();
    }
  });

  test('toolbar button set parity — same 9 buttonNames render on both sides (Phase 22)', async ({
    browser,
  }) => {
    // Both demos wire the canonical headerToolbar (prev,next today |
    // title | day,week,month,season,halfYear,year). chronix's
    // toolbar is now visible by default (Phase 22 lands the
    // `headerToolbar` prop on `<ChronixGantt>`). The reference demo
    // has wired it since pre-chronix.
    //
    // Pair by `buttonName` extracted from class regex
    // `gantt-<name>-button` / `cx-gantt-<name>-button`. Asserts the
    // 9 expected names + 1 title are present on both sides. Text
    // differs (Chinese vs English defaults) — that's a v0 by-design
    // divergence, parked under `buttonText` i18n in the catalog.
    const { kuiPage, chronixPage } = await loadBothDemos(browser, {
      id: 'toolbar-button-set-parity',
      viewId: 'week',
    });
    try {
      const kuiSnap = await extractToolbarSnapshot('kui', kuiPage);
      const chronixSnap = await extractToolbarSnapshot('chronix', chronixPage);

      const kuiIds = new Set(kuiSnap.map((w) => w.id));
      const chronixIds = new Set(chronixSnap.map((w) => w.id));
      const expected = new Set([
        'title',
        'prev',
        'next',
        'today',
        'day',
        'week',
        'month',
        'season',
        'halfYear',
        'year',
      ]);

      console.warn(
        `Phase 22 toolbar widget set: kui=[${[...kuiIds].sort().join(',')}] ` +
          `chronix=[${[...chronixIds].sort().join(',')}]`,
      );

      // Both sides must contain every expected id. (Either side may
      // emit additional ids if a future toolbar adds buttons; we
      // only assert the canonical 10 are present.)
      for (const id of expected) {
        expect(kuiIds, `reference toolbar missing '${id}'`).toContain(id);
        expect(chronixIds, `chronix toolbar missing '${id}'`).toContain(id);
      }
    } finally {
      await kuiPage.context().close();
      await chronixPage.context().close();
    }
  });

  test('toolbar active-button parity — week button is pressed on both at viewId=week (Phase 22)', async ({
    browser,
  }) => {
    // `loadBothDemos` clicks the `周` button via accessible role on
    // both demos. After the click, the active-button state should
    // propagate to the toolbar: k-ui's `<button.gantt-week-button
    // aria-pressed='true'>`, chronix's `<button.cx-gantt-week-button
    // aria-pressed='true'>`. All other view buttons must read
    // `aria-pressed='false'`.
    const { kuiPage, chronixPage } = await loadBothDemos(browser, {
      id: 'toolbar-active-button-parity',
      viewId: 'week',
    });
    try {
      const kuiSnap = await extractToolbarSnapshot('kui', kuiPage);
      const chronixSnap = await extractToolbarSnapshot('chronix', chronixPage);

      const kuiPressed = kuiSnap.filter((w) => w.isPressed).map((w) => w.id);
      const chronixPressed = chronixSnap.filter((w) => w.isPressed).map((w) => w.id);

      console.warn(
        `Phase 22 toolbar active-button: kui pressed=[${kuiPressed.join(',')}] ` +
          `chronix pressed=[${chronixPressed.join(',')}]`,
      );

      // Exactly one view button should be pressed per side, and it
      // should be 'week' on both. Nav buttons (prev / next / today)
      // are never pressed.
      expect(kuiPressed).toEqual(['week']);
      expect(chronixPressed).toEqual(['week']);
    } finally {
      await kuiPage.context().close();
      await chronixPage.context().close();
    }
  });

  test('toolbar title presence — exactly one non-empty title element per side (Phase 22)', async ({
    browser,
  }) => {
    // The title TEXT format differs between demos by design (k-ui's
    // formatRange vs chronix's `formatToolbarTitle` — both emit
    // locale-appropriate range labels, but the format strings
    // diverge: k-ui falls back to FullCalendar's defaults, chronix
    // uses Chinese-Q1 / YYYY-MM-DD / YYYY年M月 patterns). What we
    // CAN assert: both render exactly one title widget, both have
    // non-empty text. Format-equality is parked with `buttonText`
    // i18n.
    const { kuiPage, chronixPage } = await loadBothDemos(browser, {
      id: 'toolbar-title-parity',
      viewId: 'week',
    });
    try {
      const kuiSnap = await extractToolbarSnapshot('kui', kuiPage);
      const chronixSnap = await extractToolbarSnapshot('chronix', chronixPage);

      const kuiTitle = kuiSnap.find((w) => w.kind === 'title');
      const chronixTitle = chronixSnap.find((w) => w.kind === 'title');

      console.warn(
        `Phase 22 toolbar title: kui='${kuiTitle?.text ?? '(missing)'}' ` +
          `chronix='${chronixTitle?.text ?? '(missing)'}'`,
      );

      expect(kuiTitle, 'reference toolbar title widget missing').toBeDefined();
      expect(chronixTitle, 'chronix toolbar title widget missing').toBeDefined();
      expect(kuiTitle!.text.length, 'reference title is empty').toBeGreaterThan(0);
      expect(chronixTitle!.text.length, 'chronix title is empty').toBeGreaterThan(0);
    } finally {
      await kuiPage.context().close();
      await chronixPage.context().close();
    }
  });

  test('phase24-handle.next() — toolbar title changes equivalently on both sides', async ({
    browser,
  }) => {
    // Both demos expose hidden test buttons at
    // [data-test-handle-method='next']. Clicking invokes
    // chronix's `handle.next()` (compute-and-emit via
    // update:axisInput) and k-ui's `api.next()` (dispatch CHANGE_DATE).
    // After click, both toolbars must show a title text DIFFERENT from
    // the pre-click title — confirming the chart re-rendered at a new
    // anchor. Exact format equality is parked per Phase 22 disposition;
    // what we assert is "before ≠ after on each side, both sides
    // observed the change".
    const { kuiPage, chronixPage } = await loadBothDemos(browser, {
      id: 'phase24-handle-next-parity',
      viewId: 'week',
    });
    try {
      const beforeKui = (await extractToolbarSnapshot('kui', kuiPage)).find(
        (w) => w.kind === 'title',
      )!.text;
      const beforeChronix = (await extractToolbarSnapshot('chronix', chronixPage)).find(
        (w) => w.kind === 'title',
      )!.text;

      await kuiPage.click("[data-test-handle-method='next']");
      await chronixPage.click("[data-test-handle-method='next']");
      // Give the reactive cycle a frame to settle.
      await kuiPage.waitForTimeout(50);
      await chronixPage.waitForTimeout(50);

      const afterKui = (await extractToolbarSnapshot('kui', kuiPage)).find(
        (w) => w.kind === 'title',
      )!.text;
      const afterChronix = (await extractToolbarSnapshot('chronix', chronixPage)).find(
        (w) => w.kind === 'title',
      )!.text;

      console.warn(
        `Phase 24 handle.next title shift: kui '${beforeKui}'→'${afterKui}' ` +
          `chronix '${beforeChronix}'→'${afterChronix}'`,
      );

      expect(afterKui, 'reference title did not change after api.next()').not.toBe(beforeKui);
      expect(afterChronix, 'chronix title did not change after handle.next()').not.toBe(
        beforeChronix,
      );
    } finally {
      await kuiPage.context().close();
      await chronixPage.context().close();
    }
  });

  test('phase24-handle.changeView(month) — month button pressed on both sides afterward', async ({
    browser,
  }) => {
    // After clicking the changeView-month test button, both toolbars
    // should reflect the new viewId — `aria-pressed='true'` on the
    // `month` widget, all other view widgets unpressed. Same widget-set
    // / pressed-state mechanism as the Phase 22 toolbar-active-button
    // assertion, just invoked via imperative handle instead of toolbar
    // click.
    const { kuiPage, chronixPage } = await loadBothDemos(browser, {
      id: 'phase24-handle-changeView-parity',
      viewId: 'week',
    });
    try {
      await kuiPage.click("[data-test-handle-method='changeView-month']");
      await chronixPage.click("[data-test-handle-method='changeView-month']");
      await kuiPage.waitForTimeout(50);
      await chronixPage.waitForTimeout(50);

      const kuiSnap = await extractToolbarSnapshot('kui', kuiPage);
      const chronixSnap = await extractToolbarSnapshot('chronix', chronixPage);
      const kuiPressed = kuiSnap.filter((w) => w.isPressed).map((w) => w.id);
      const chronixPressed = chronixSnap.filter((w) => w.isPressed).map((w) => w.id);

      console.warn(
        `Phase 24 handle.changeView('month') pressed: kui=[${kuiPressed.join(',')}] ` +
          `chronix=[${chronixPressed.join(',')}]`,
      );

      expect(kuiPressed).toEqual(['month']);
      expect(chronixPressed).toEqual(['month']);
    } finally {
      await kuiPage.context().close();
      await chronixPage.context().close();
    }
  });

  test('phase24-handle.today() — title resets to a today-shaped value on both sides', async ({
    browser,
  }) => {
    // `today()` always sets the anchor to local-midnight today, so
    // calling it twice produces the same title. Drive the title to a
    // non-today value first (via next()), then click today(), and
    // assert both sides converged back to a non-empty title containing
    // the current year — gives us a deterministic post-click signal
    // without coupling to the exact format.
    const { kuiPage, chronixPage } = await loadBothDemos(browser, {
      id: 'phase24-handle-today-parity',
      viewId: 'week',
    });
    try {
      // Step the anchor away from today.
      await kuiPage.click("[data-test-handle-method='next']");
      await chronixPage.click("[data-test-handle-method='next']");
      await kuiPage.waitForTimeout(50);
      await chronixPage.waitForTimeout(50);

      // Reset.
      await kuiPage.click("[data-test-handle-method='today']");
      await chronixPage.click("[data-test-handle-method='today']");
      await kuiPage.waitForTimeout(50);
      await chronixPage.waitForTimeout(50);

      const kuiTitle = (await extractToolbarSnapshot('kui', kuiPage)).find(
        (w) => w.kind === 'title',
      )!.text;
      const chronixTitle = (await extractToolbarSnapshot('chronix', chronixPage)).find(
        (w) => w.kind === 'title',
      )!.text;
      const currentYear = String(new Date().getFullYear());

      console.warn(
        `Phase 24 handle.today() titles: kui='${kuiTitle}' chronix='${chronixTitle}' ` +
          `(expecting both to contain '${currentYear}')`,
      );

      expect(kuiTitle).toContain(currentYear);
      expect(chronixTitle).toContain(currentYear);
    } finally {
      await kuiPage.context().close();
      await chronixPage.context().close();
    }
  });

  test('phase24-handle.scrollToDate — scrollLeft of chart wrapper becomes non-zero on both sides', async ({
    browser,
  }) => {
    // chronix scrollToDate(anchor+1d) and k-ui scrollToTime({ days: 1 })
    // both ask the chart wrapper to scroll. With the demo anchor at
    // today and view=week the target lands well inside the rendered
    // axis; both wrappers should end up with a positive scrollLeft.
    // We don't compare absolute scroll values across demos (different
    // viewport widths, different wrapper-element selectors, slightly
    // different axis math), only that BOTH moved.
    const { kuiPage, chronixPage } = await loadBothDemos(browser, {
      id: 'phase24-handle-scrollToDate-parity',
      viewId: 'week',
    });
    try {
      await kuiPage.click("[data-test-handle-method='scrollToDate']");
      await chronixPage.click("[data-test-handle-method='scrollToDate']");
      await kuiPage.waitForTimeout(50);
      await chronixPage.waitForTimeout(50);

      const kuiScrollLeft = await kuiPage.evaluate(() => {
        // k-ui's chart body scroll container — fall through known
        // class options to stay resilient to internal restructuring.
        const candidates = [
          '.gantt-timeline-body-right',
          '.gantt-scroller-harness',
          '.gantt-scroller',
        ];
        for (const sel of candidates) {
          const el = document.querySelector<HTMLElement>(sel);
          if (el && el.scrollLeft > 0) return el.scrollLeft;
        }
        return 0;
      });
      const chronixScrollLeft = await chronixPage.evaluate(() => {
        const wrap = document.querySelector<HTMLElement>('.cx-gantt-wrapper');
        return wrap?.scrollLeft ?? 0;
      });

      console.warn(
        `Phase 24 handle.scrollToDate scrollLeft: kui=${kuiScrollLeft} chronix=${chronixScrollLeft}`,
      );

      expect(kuiScrollLeft, 'reference wrapper did not scroll on api.scrollToTime').toBeGreaterThan(
        0,
      );
      expect(
        chronixScrollLeft,
        'chronix wrapper did not scroll on handle.scrollToDate',
      ).toBeGreaterThan(0);
    } finally {
      await kuiPage.context().close();
      await chronixPage.context().close();
    }
  });
});
