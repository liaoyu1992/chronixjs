/**
 * **Cross-demo parity helper — Phase 17.**
 *
 * Codifies the side-by-side k-ui-vs-chronix DOM comparison pattern
 * for parity.spec.ts assertions. Without this helper each test
 * reinvents the boilerplate (launch two BrowserContexts, install
 * frozen clock on both, navigate, switch view, extract bbox per
 * bar, pair by id, diff) — and reinvents it slightly differently,
 * which silently weakens the parity check.
 *
 * **Prerequisites for tests using these helpers**:
 *
 * 1. k-ui demo must be running at `KUI_DEMO_URL` (default
 *    `http://localhost:8701/`).
 * 2. chronix demo must be running at `CHRONIX_DEMO_URL` (default
 *    `http://localhost:8702/`) AND must support the `?parity=true`
 *    URL query — see audit/PHASE_17_PARITY_INFRASTRUCTURE_DESIGN.md
 *    and `examples/gantt-vue3/src/sample-data-parity.ts`.
 *
 * **What v0 supports**:
 *
 * - Bar channel: id-paired diff of (x, width). Y / height excluded
 *   by default tolerance because chronix renders rows in input
 *   order while k-ui re-sorts by baseName grouping (see catalog in
 *   the design doc).
 *
 * **What v0 doesn't support yet** (additive extension points):
 *
 * - Tick channel, header-row cell channel, sidebar-cell channel,
 *   link-path channel, marker `<defs>` channel — each is a separate
 *   `extract<Channel>Snapshot` + `diff<Channel>Snapshots` pair to
 *   add in future phases as the assertions accrete.
 * - Pointer-gesture driving (drag a bar on both demos, diff the
 *   resulting state). Would extend `loadBothDemos` to return an
 *   `applyGesture(steps)` helper.
 * - Multi-scenario fixtures (currently scenarios are inline objects;
 *   could promote to a registry once parity tests get numerous).
 */

import { CHART_SELECTOR, FROZEN_TIME_ISO, VIEWPORT } from './config.js';

import type { Browser, BrowserContext, Locator, Page } from '@playwright/test';

export const KUI_DEMO_URL = process.env['KUI_DEMO_URL'] ?? 'http://localhost:8701/';

/**
 * The chronix demo URL. Note: we deliberately DON'T concatenate
 * `?parity=true` here — caller-side test code is the one that opts
 * into parity mode by passing the right URL to `goto()`. The helper
 * always appends `?parity=true` itself in `loadBothDemos`.
 */
export const CHRONIX_DEMO_URL = process.env['CHRONIX_PARITY_DEMO_URL'] ?? 'http://localhost:8702/';

export type ChronixViewId = 'day' | 'week' | 'month' | 'season' | 'halfYear' | 'year';

/**
 * View-toggle button labels for the demo's view-switch UI. k-ui demo
 * + chronix demo both use these zh-CN labels (chronix mirrored them
 * in `examples/gantt-vue3/src/App.vue`'s `VIEW_TOGGLE` array).
 */
export const VIEW_TOGGLE_LABEL: Record<ChronixViewId, string> = {
  day: '日',
  week: '周',
  month: '月',
  season: '季',
  halfYear: '半年',
  year: '年',
};

export interface ParityScenario {
  /** Human-readable id, used in failure messages. */
  readonly id: string;
  readonly viewId: ChronixViewId;
}

export interface BothDemos {
  readonly kuiPage: Page;
  readonly chronixPage: Page;
  readonly kuiChart: Locator;
  readonly chronixChart: Locator;
}

const CHRONIX_BODY_SELECTOR = 'svg.cx-gantt-body';
const CHRONIX_CHART_SELECTOR = 'div.cx-gantt-wrapper';

const settle = (page: Page) =>
  page.evaluate(
    () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
  );

/**
 * Opens k-ui demo AND chronix demo (with `?parity=true`) in two
 * separate `BrowserContext` instances. Installs the frozen clock
 * (`FROZEN_TIME_ISO`) on both pages, navigates each to its root,
 * waits for the chart to render, and clicks the view-toggle button
 * matching the scenario's viewId.
 *
 * Returns:
 * - `kuiPage` / `chronixPage` — the two Page objects. Caller MUST
 *   close their contexts in a `finally` block to free browser
 *   resources.
 * - `kuiChart` / `chronixChart` — chart-root Locators (relative to
 *   which bar / tick coordinates will be measured).
 */
export async function loadBothDemos(
  browser: Browser,
  scenario: ParityScenario,
): Promise<BothDemos> {
  const toggleLabel = VIEW_TOGGLE_LABEL[scenario.viewId];

  const kuiContext: BrowserContext = await browser.newContext({
    baseURL: KUI_DEMO_URL,
    viewport: VIEWPORT,
    timezoneId: 'Asia/Shanghai',
    locale: 'zh-CN',
  });
  const chronixContext: BrowserContext = await browser.newContext({
    baseURL: CHRONIX_DEMO_URL,
    viewport: VIEWPORT,
    timezoneId: 'Asia/Shanghai',
    locale: 'zh-CN',
  });

  const kuiPage = await kuiContext.newPage();
  const chronixPage = await chronixContext.newPage();

  // Install frozen clock BEFORE navigation so the demos' module-load
  // `new Date()` calls (which anchor today's data) see the frozen
  // epoch.
  await kuiPage.clock.install({ time: new Date(FROZEN_TIME_ISO) });
  await chronixPage.clock.install({ time: new Date(FROZEN_TIME_ISO) });

  // Navigate. chronix gets `?parity=true` so the demo loads the
  // k-ui-equivalent sample dataset.
  await Promise.all([kuiPage.goto('/'), chronixPage.goto('/?parity=true')]);

  // Wait for both charts to mount.
  const kuiChart = kuiPage.locator(CHART_SELECTOR);
  const chronixChart = chronixPage.locator(CHRONIX_CHART_SELECTOR);
  await kuiChart.waitFor({ state: 'visible' });
  await chronixPage.locator(CHRONIX_BODY_SELECTOR).waitFor({ state: 'visible' });
  await chronixChart.waitFor({ state: 'visible' });
  await Promise.all([
    kuiPage.waitForLoadState('networkidle'),
    chronixPage.waitForLoadState('networkidle'),
    settle(kuiPage),
    settle(chronixPage),
  ]);

  // Switch view via toggle buttons. The two demos use the same
  // zh-CN labels (日 / 周 / 月 / 季 / 半年 / 年).
  await kuiChart.getByRole('button', { name: toggleLabel, exact: true }).click();
  await chronixPage.getByRole('button', { name: toggleLabel, exact: true }).click();

  await Promise.all([settle(kuiPage), settle(chronixPage)]);

  return { kuiPage, chronixPage, kuiChart, chronixChart };
}

export interface DomBarSnapshot {
  /** Cross-demo identity (`event-N`). */
  readonly id: string;
  /** Relative to chart-root left edge, px. */
  readonly x: number;
  /** Relative to chart-root top edge, px. */
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Extracts bar bbox snapshots from either demo, normalized to a
 * common shape:
 *
 * - **k-ui**: queries `[data-event-id]`. K-ui's bar `<g>` may contain
 *   inner overlays (progress triangle, etc.) — those are filtered by
 *   `height < 4` and by widest-wins dedup per id.
 * - **chronix**: queries `[data-bar-id]`. Chronix bar `<rect>` is a
 *   single element per bar; no dedup needed but the same filter
 *   protects against future overlays.
 *
 * Coordinate frame: positions relative to the chart-root's bounding
 * box. This isolates the demos' surrounding chrome (page headers,
 * sidebars, etc.) so the comparison is geometry-only.
 *
 * Values are rounded to 2 decimal places to handle sub-pixel
 * rendering noise without losing precision.
 */
export function extractBarsSnapshot(
  source: 'kui' | 'chronix',
  chart: Locator,
): Promise<DomBarSnapshot[]> {
  const attrName = source === 'kui' ? 'data-event-id' : 'data-bar-id';
  // Bars are positioned in TIMELINE-BODY content space — relative to
  // the body wrapper's left edge (post-sidebar). The chart-root
  // Locator includes the sidebar, which differs in width between
  // demos (k-ui's resource panel ~288px at viewport 1440; chronix's
  // 3-column sidebar 240px). Measuring bar.left − chartRect.left
  // bakes the sidebar width into x, making the two demos disagree
  // by their sidebar-width delta. Measure relative to the body
  // wrapper instead so the axis x=0 anchor matches.
  const bodyWrapperSelector =
    source === 'kui' ? '.gantt-timeline-body-wrapper' : 'svg.cx-gantt-body';
  return chart.evaluate(
    (_root, { attrName: attr, bodySel }) => {
      const bodyEl = document.querySelector(bodySel);
      const bodyRect = bodyEl?.getBoundingClientRect();
      if (!bodyRect) return [];
      const out: {
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
      }[] = [];
      document.querySelectorAll<SVGElement>(`[${attr}]`).forEach((el) => {
        const id = el.getAttribute(attr) ?? '';
        const r = el.getBoundingClientRect();
        if (r.height < 4 || r.width < 1) return;
        out.push({
          id,
          x: Math.round((r.left - bodyRect.left) * 100) / 100,
          y: Math.round((r.top - bodyRect.top) * 100) / 100,
          width: Math.round(r.width * 100) / 100,
          height: Math.round(r.height * 100) / 100,
        });
      });
      // Dedupe by id, widest wins — k-ui bars may have inner-overlay
      // children (progress triangle, resize handles) that also carry
      // the data-event-id attribute.
      const widest = new Map<string, (typeof out)[number]>();
      for (const b of out) {
        const prev = widest.get(b.id);
        if (!prev || b.width > prev.width) widest.set(b.id, b);
      }
      return [...widest.values()];
    },
    { attrName, bodySel: bodyWrapperSelector },
  );
}

export interface ParityTolerance {
  /** Maximum allowed delta in px. Default 1 px. Set to `Infinity` to skip the channel. */
  readonly x?: number;
  readonly y?: number;
  readonly width?: number;
  readonly height?: number;
}

export interface ParityMismatch {
  readonly barId: string;
  readonly field: 'x' | 'y' | 'width' | 'height';
  readonly kuiValue: number;
  readonly chronixValue: number;
  readonly delta: number;
}

export interface ParityDiff {
  readonly mismatches: readonly ParityMismatch[];
  /** Bar ids present in k-ui snapshot but missing from chronix. */
  readonly onlyInKui: readonly string[];
  /** Bar ids present in chronix snapshot but missing from k-ui. */
  readonly onlyInChronix: readonly string[];
}

const DEFAULT_TOLERANCE: Required<ParityTolerance> = {
  x: 1,
  y: 1,
  width: 1,
  height: 1,
};

/**
 * Diffs two bar snapshots. Pairs by id (parity mode ensures both
 * demos use `event-N` ids). For each paired bar, checks each of
 * (x, y, width, height) against the per-channel tolerance — a
 * mismatch occurs when `|kui - chronix| > tolerance`.
 *
 * Tolerance defaults to 1 px per channel. Pass
 * `{ y: Infinity, height: Infinity }` to skip those channels (the
 * standard cross-demo bar parity tolerance in v0 because chronix
 * doesn't replicate k-ui's resource-grouping row order).
 *
 * Bars present in only one snapshot are NOT mismatches by default —
 * they're reported separately via `onlyInKui` / `onlyInChronix` so
 * the calling test can decide whether to fail on missing pairs.
 */
export function diffBarsSnapshots(
  kui: readonly DomBarSnapshot[],
  chronix: readonly DomBarSnapshot[],
  tolerance: ParityTolerance = {},
): ParityDiff {
  const tol: Required<ParityTolerance> = {
    x: tolerance.x ?? DEFAULT_TOLERANCE.x,
    y: tolerance.y ?? DEFAULT_TOLERANCE.y,
    width: tolerance.width ?? DEFAULT_TOLERANCE.width,
    height: tolerance.height ?? DEFAULT_TOLERANCE.height,
  };

  const kuiById = new Map(kui.map((b) => [b.id, b]));
  const chronixById = new Map(chronix.map((b) => [b.id, b]));

  const mismatches: ParityMismatch[] = [];
  const onlyInKui: string[] = [];
  const onlyInChronix: string[] = [];

  for (const [id, kuiBar] of kuiById) {
    const chronixBar = chronixById.get(id);
    if (!chronixBar) {
      onlyInKui.push(id);
      continue;
    }
    for (const field of ['x', 'y', 'width', 'height'] as const) {
      const fieldTol = tol[field];
      if (!Number.isFinite(fieldTol)) continue;
      const delta = Math.abs(kuiBar[field] - chronixBar[field]);
      if (delta > fieldTol) {
        mismatches.push({
          barId: id,
          field,
          kuiValue: kuiBar[field],
          chronixValue: chronixBar[field],
          delta,
        });
      }
    }
  }
  for (const id of chronixById.keys()) {
    if (!kuiById.has(id)) onlyInChronix.push(id);
  }

  return { mismatches, onlyInKui, onlyInChronix };
}

/**
 * Formats a parity diff as a multi-line string suitable for
 * `console.warn` or assertion-failure messages. Groups mismatches by
 * bar id; appends onlyInKui / onlyInChronix lists.
 */
export function formatParityDiff(diff: ParityDiff): string {
  const lines: string[] = [];

  if (diff.mismatches.length > 0) {
    lines.push(`${diff.mismatches.length} bar-field mismatch(es):`);
    const byBar = new Map<string, ParityMismatch[]>();
    for (const m of diff.mismatches) {
      const list = byBar.get(m.barId) ?? [];
      list.push(m);
      byBar.set(m.barId, list);
    }
    for (const [barId, ms] of byBar) {
      lines.push(`  ${barId}:`);
      for (const m of ms) {
        lines.push(
          `    ${m.field}: kui=${m.kuiValue} chronix=${m.chronixValue} Δ=${m.delta.toFixed(2)}`,
        );
      }
    }
  }

  if (diff.onlyInKui.length > 0) {
    lines.push(`Bars only in k-ui DOM (${diff.onlyInKui.length}): ${diff.onlyInKui.join(', ')}`);
  }
  if (diff.onlyInChronix.length > 0) {
    lines.push(
      `Bars only in chronix DOM (${diff.onlyInChronix.length}): ${diff.onlyInChronix.join(', ')}`,
    );
  }

  return lines.length === 0 ? 'parity OK (no mismatches)' : lines.join('\n');
}
