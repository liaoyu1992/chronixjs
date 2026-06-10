/**
 * **Cross-demo parity helper — Phase 17.**
 *
 * Codifies the cross-demo DOM comparison pattern
 * for parity.spec.ts assertions. Without this helper each test
 * reinvents the boilerplate (launch two BrowserContexts, install
 * frozen clock on both, navigate, switch view, extract bbox per
 * bar, pair by id, diff) — and reinvents it slightly differently,
 * which silently weakens the parity check.
 *
 * **Prerequisites for tests using these helpers**:
 *
 * 1. original demo must be running at `REFERENCE_DEMO_URL` (default
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
 *   order while reference re-sorts by baseName grouping (see catalog in
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
import { TIMELINE_BODY_WRAPPER } from './reference-dom-map.js';

import type { CrossDemoScenario } from './cross-demo-scenarios.js';
import type { Browser, BrowserContext, Locator, Page } from '@playwright/test';

export const REFERENCE_DEMO_URL = process.env['REFERENCE_DEMO_URL'] ?? 'http://localhost:8701/';

/**
 * The chronix demo URL. Note: we deliberately DON'T concatenate
 * `?parity=true` here — caller-side test code is the one that opts
 * into parity mode by passing the right URL to `goto()`. The helper
 * always appends `?parity=true` itself in `loadBothDemos`.
 */
export const CHRONIX_DEMO_URL = process.env['CHRONIX_PARITY_DEMO_URL'] ?? 'http://localhost:8702/';

/**
 * **Phase 31.6: original demo URL.** reference-vue2's own `vite.config.js`
 * hard-codes port 8702, which CONFLICTS with chronix-vue3's demo (also
 * 8702). Per Phase 31.6 Decision B.1, this is treated as an operational
 * constraint: when running vue2 parity tests, the user must stop the
 * chronix-vue3 demo (frees 8702) AND start the original demo there.
 * To override (e.g. run reference-vue2 on a non-default port via
 * `pnpm dev -- --port 8704`), set `REFERENCE_VUE2_DEMO_URL` in env.
 *
 * Chronix MUST NOT modify reference repo source files; the default matches
 * reference-vue2's own published config (lowest surprise for first-time
 * users; conflict resolution is documented).
 */
export const REFERENCE_VUE2_DEMO_URL =
  process.env['REFERENCE_VUE2_DEMO_URL'] ?? 'http://localhost:8702/';

/**
 * **Phase 31.6: chronix-vue2 demo URL.** Matches chronix-vue2's existing
 * dev port (8703 — never conflicts with any reference port). Env-overridable
 * (`CHRONIX_VUE2_DEMO_URL=...`) if a consumer reconfigures.
 *
 * `loadBothDemosVue2` always appends `?parity=true` itself when
 * navigating, so callers should NOT include it in this base URL.
 */
export const CHRONIX_VUE2_DEMO_URL =
  process.env['CHRONIX_VUE2_DEMO_URL'] ?? 'http://localhost:8703/';

/**
 * **Phase 47: chronix-react demo URL.** Matches chronix-react's existing
 * dev port (8704 — never conflicts with any reference port; sits one above
 * chronix-vue2's 8703 in the chronix-port-bank). Env-overridable
 * (`CHRONIX_REACT_DEMO_URL=...`) if a consumer reconfigures.
 *
 * `loadBothDemosReact` always appends `?parity=true` itself when
 * navigating, so callers should NOT include it in this base URL.
 *
 * Original spec for chronix-react is the original vue3 demo at 8701 (NOT
 * reference-vue2). chronix-react uses vue3's `parity-events` dataset
 * (`@chronixjs/golden-runner/parity-events`) so the bar-id pairings +
 * resource ids match the chronix-vue3 the original spec byte-for-byte.
 */
export const CHRONIX_REACT_DEMO_URL =
  process.env['CHRONIX_REACT_DEMO_URL'] ?? 'http://localhost:8704/';

export type ChronixViewId = 'day' | 'week' | 'month' | 'season' | 'halfYear' | 'year';

/**
 * View-toggle button labels for the demo's view-switch UI. original demo
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
  /**
   * Phase 28.3.1: additional `key=val&key=val` URL params for the
   * chronix demo (reference side unchanged — the original demo has no
   * URL-config layer). When set, `loadBothDemos` appends them after
   * the mandatory `parity=true` flag so chronix opts into per-test
   * features (e.g. `useLineEventColor=true&priorityCallback=true`).
   * Existing call sites omit this field → behavior unchanged.
   */
  readonly chronixUrlExtras?: string;
}

export interface BothDemos {
  readonly referencePage: Page;
  readonly chronixPage: Page;
  readonly referenceChart: Locator;
  readonly chronixChart: Locator;
}

const CHRONIX_BODY_SELECTOR = 'svg.cx-gantt-body';
const CHRONIX_CHART_SELECTOR = 'div.cx-gantt-wrapper';

const settle = (page: Page) =>
  page.evaluate(
    () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
  );

/**
 * Opens original demo AND chronix demo (with `?parity=true`) in two
 * separate `BrowserContext` instances. Installs the frozen clock
 * (`FROZEN_TIME_ISO`) on both pages, navigates each to its root,
 * waits for the chart to render, and clicks the view-toggle button
 * matching the scenario's viewId.
 *
 * Returns:
 * - `referencePage` / `chronixPage` — the two Page objects. Caller MUST
 *   close their contexts in a `finally` block to free browser
 *   resources.
 * - `referenceChart` / `chronixChart` — chart-root Locators (relative to
 *   which bar / tick coordinates will be measured).
 */
export async function loadBothDemos(
  browser: Browser,
  scenario: ParityScenario,
): Promise<BothDemos> {
  const toggleLabel = VIEW_TOGGLE_LABEL[scenario.viewId];

  const referenceContext: BrowserContext = await browser.newContext({
    baseURL: REFERENCE_DEMO_URL,
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

  const referencePage = await referenceContext.newPage();
  const chronixPage = await chronixContext.newPage();

  // Install frozen clock BEFORE navigation so the demos' module-load
  // `new Date()` calls (which anchor today's data) see the frozen
  // epoch.
  await referencePage.clock.install({ time: new Date(FROZEN_TIME_ISO) });
  await chronixPage.clock.install({ time: new Date(FROZEN_TIME_ISO) });

  // Navigate. chronix gets `?parity=true` so the demo loads the
  // reference-equivalent sample dataset. Phase 28.3.1: append any
  // scenario-supplied URL extras after the mandatory `parity=true`.
  const chronixPath = scenario.chronixUrlExtras
    ? `/?parity=true&${scenario.chronixUrlExtras}`
    : '/?parity=true';
  await Promise.all([referencePage.goto('/'), chronixPage.goto(chronixPath)]);

  // Wait for both charts to mount.
  const referenceChart = referencePage.locator(CHART_SELECTOR);
  const chronixChart = chronixPage.locator(CHRONIX_CHART_SELECTOR);
  await referenceChart.waitFor({ state: 'visible' });
  await chronixPage.locator(CHRONIX_BODY_SELECTOR).waitFor({ state: 'visible' });
  await chronixChart.waitFor({ state: 'visible' });
  await Promise.all([
    referencePage.waitForLoadState('networkidle'),
    chronixPage.waitForLoadState('networkidle'),
    settle(referencePage),
    settle(chronixPage),
  ]);

  // Switch view via toggle buttons. The two demos use the same
  // zh-CN labels (日 / 周 / 月 / 季 / 半年 / 年).
  await referenceChart.getByRole('button', { name: toggleLabel, exact: true }).click();
  await chronixPage.getByRole('button', { name: toggleLabel, exact: true }).click();

  await Promise.all([settle(referencePage), settle(chronixPage)]);

  return { referencePage, chronixPage, referenceChart, chronixChart };
}

/**
 * **Phase 31.6: chronix-vue2 sibling of `loadBothDemos`.**
 *
 * Opens original demo AND chronix-vue2 demo (with `?parity=true`) in
 * two separate `BrowserContext` instances. Installs the frozen clock
 * (`FROZEN_TIME_ISO`) on both pages, navigates each to its root, waits
 * for the chart to render, and clicks the view-toggle button matching
 * the scenario's viewId.
 *
 * Differs from `loadBothDemos` only in URL constants (vue2 ports +
 * `?parity=true` flag goes to chronix-vue2 demo's `main.ts` URL parser
 * not vue3's `demo-config.ts`). Selector strings are identical —
 * chronix-vue2 + chronix-vue3 share `svg.cx-gantt-body` body selector
 * + `div.cx-gantt-wrapper` chart-root selector by design (Phase 31.5.2
 * dual-scrollport restructure preserved these in vue2). reference-vue2 +
 * reference-vue3 share `.gantt-timeline-body-wrapper` body selector via
 * the shared `@reference/gantt-scheduler` core.
 *
 * Returns the same `BothDemos` shape so callers writing tests against
 * `loadBothDemos` can swap to `loadBothDemosVue2` with no code change
 * other than the function name.
 */
export async function loadBothDemosVue2(
  browser: Browser,
  scenario: ParityScenario,
): Promise<BothDemos> {
  const toggleLabel = VIEW_TOGGLE_LABEL[scenario.viewId];

  const referenceContext: BrowserContext = await browser.newContext({
    baseURL: REFERENCE_VUE2_DEMO_URL,
    viewport: VIEWPORT,
    timezoneId: 'Asia/Shanghai',
    locale: 'zh-CN',
  });
  const chronixContext: BrowserContext = await browser.newContext({
    baseURL: CHRONIX_VUE2_DEMO_URL,
    viewport: VIEWPORT,
    timezoneId: 'Asia/Shanghai',
    locale: 'zh-CN',
  });

  const referencePage = await referenceContext.newPage();
  const chronixPage = await chronixContext.newPage();

  await referencePage.clock.install({ time: new Date(FROZEN_TIME_ISO) });
  await chronixPage.clock.install({ time: new Date(FROZEN_TIME_ISO) });

  const chronixPath = scenario.chronixUrlExtras
    ? `/?parity=true&${scenario.chronixUrlExtras}`
    : '/?parity=true';
  await Promise.all([referencePage.goto('/'), chronixPage.goto(chronixPath)]);

  const referenceChart = referencePage.locator(CHART_SELECTOR);
  const chronixChart = chronixPage.locator(CHRONIX_CHART_SELECTOR);
  await referenceChart.waitFor({ state: 'visible' });
  await chronixPage.locator(CHRONIX_BODY_SELECTOR).waitFor({ state: 'visible' });
  await chronixChart.waitFor({ state: 'visible' });
  await Promise.all([
    referencePage.waitForLoadState('networkidle'),
    chronixPage.waitForLoadState('networkidle'),
    settle(referencePage),
    settle(chronixPage),
  ]);

  await referenceChart.getByRole('button', { name: toggleLabel, exact: true }).click();
  await chronixPage.getByRole('button', { name: toggleLabel, exact: true }).click();

  await Promise.all([settle(referencePage), settle(chronixPage)]);

  return { referencePage, chronixPage, referenceChart, chronixChart };
}

/**
 * **Phase 47: chronix-react sibling of `loadBothDemos` / `loadBothDemosVue2`.**
 *
 * Opens reference-vue3 demo at port 8701 AND chronix-react demo at port 8704
 * (with `?parity=true`) in two separate `BrowserContext` instances.
 * Installs the frozen clock (`FROZEN_TIME_ISO`) on both pages, navigates
 * each to its root, waits for the chart to render, and clicks the
 * view-toggle button matching the scenario's viewId.
 *
 * Original spec is reference-vue3 (NOT reference-vue2). chronix-react uses
 * vue3's `parity-events` dataset (`@chronixjs/golden-runner/parity-events`)
 * — same event-id pairings + same `RESOURCES[]` ordering as chronix-vue3.
 * Differs from `loadBothDemos` only in the chronix-side URL constant
 * (port 8703 → 8704). Selector strings are identical — chronix-react
 * preserves `svg.cx-gantt-body` body selector + `div.cx-gantt-wrapper`
 * chart-root selector by design (Phase 32 scaffold preserved both).
 *
 * Returns the same `BothDemos` shape so callers writing tests against
 * `loadBothDemos` can swap to `loadBothDemosReact` with no code change
 * other than the function name.
 */
export async function loadBothDemosReact(
  browser: Browser,
  scenario: ParityScenario,
): Promise<BothDemos> {
  const toggleLabel = VIEW_TOGGLE_LABEL[scenario.viewId];

  const referenceContext: BrowserContext = await browser.newContext({
    baseURL: REFERENCE_DEMO_URL,
    viewport: VIEWPORT,
    timezoneId: 'Asia/Shanghai',
    locale: 'zh-CN',
  });
  const chronixContext: BrowserContext = await browser.newContext({
    baseURL: CHRONIX_REACT_DEMO_URL,
    viewport: VIEWPORT,
    timezoneId: 'Asia/Shanghai',
    locale: 'zh-CN',
  });

  const referencePage = await referenceContext.newPage();
  const chronixPage = await chronixContext.newPage();

  await referencePage.clock.install({ time: new Date(FROZEN_TIME_ISO) });
  await chronixPage.clock.install({ time: new Date(FROZEN_TIME_ISO) });

  const chronixPath = scenario.chronixUrlExtras
    ? `/?parity=true&${scenario.chronixUrlExtras}`
    : '/?parity=true';
  await Promise.all([referencePage.goto('/'), chronixPage.goto(chronixPath)]);

  const referenceChart = referencePage.locator(CHART_SELECTOR);
  const chronixChart = chronixPage.locator(CHRONIX_CHART_SELECTOR);
  await referenceChart.waitFor({ state: 'visible' });
  await chronixPage.locator(CHRONIX_BODY_SELECTOR).waitFor({ state: 'visible' });
  await chronixChart.waitFor({ state: 'visible' });
  await Promise.all([
    referencePage.waitForLoadState('networkidle'),
    chronixPage.waitForLoadState('networkidle'),
    settle(referencePage),
    settle(chronixPage),
  ]);

  await referenceChart.getByRole('button', { name: toggleLabel, exact: true }).click();
  await chronixPage.getByRole('button', { name: toggleLabel, exact: true }).click();

  await Promise.all([settle(referencePage), settle(chronixPage)]);

  return { referencePage, chronixPage, referenceChart, chronixChart };
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
  /**
   * Phase 20: computed `fill` from the bar's primary colored rect.
   * Returned in CSS `rgb(R, G, B)` form (the browser-normalized
   * shape from `getComputedStyle`). Chronix's `<rect data-bar-id>`
   * carries inline `fill=`; reference's `<g data-event-id>` wraps an
   * inner `<rect>` whose fill is the bar color. Helper transparently
   * walks one child level when the bar element itself isn't a rect.
   */
  readonly fill: string;
  /**
   * Phase 20.5: optional computed-style map. Only populated when
   * the caller passes `options.computedStyle` to `extractBarsSnapshot`.
   * Keys match the `ComputedStyleKey` union; values are the
   * browser-normalized strings from `getComputedStyle()`.
   */
  readonly style?: Readonly<Partial<Record<ComputedStyleKey, string>>>;
}

/**
 * **Phase 20.5: centralized snapshot infrastructure.**
 *
 * 16 computed-style keys the snapshot helpers can capture per
 * element. Restricted to a typed string-literal union so each new
 * channel that wants to read a style key extends this list
 * explicitly — typos at the test-site fail at compile time. Add
 * new keys here as future phases need them.
 */
export type ComputedStyleKey =
  | 'fill'
  | 'stroke'
  | 'strokeWidth'
  | 'opacity'
  | 'fontFamily'
  | 'fontSize'
  | 'fontWeight'
  | 'fontStyle'
  | 'color'
  | 'backgroundColor'
  | 'borderColor'
  | 'cursor'
  | 'visibility'
  | 'display'
  | 'transform'
  | 'transition';

/**
 * Phase 20.5: options bag accepted by every `extractXxxSnapshot`
 * helper. Empty / omitted = cheap path (no computed-style
 * extraction); non-empty list = `getComputedStyle()` is called per
 * element and the requested keys are bundled into each snapshot's
 * `style` field.
 */
export interface SnapshotOptions {
  /** Which computed-style keys to capture per element. */
  readonly computedStyle?: readonly ComputedStyleKey[];
  /**
   * Optional regex applied to leaf-text content when the source
   * DOM doesn't carry a stable class selector for the channel
   * (reference ticks and header cells are text-only — no class). Pass
   * the format regex (e.g. `/^\d+时$/` for day-view hour ticks).
   * When omitted, the helper falls back to class-based selection
   * via `SELECTORS[source]`.
   */
  readonly labelRegex?: RegExp;
}

/**
 * Phase 20.5: generic element snapshot shape used by every
 * non-bar extractor. Bars keep their own `DomBarSnapshot` because
 * pre-Phase-20.5 tests expect the `fill` field to be top-level
 * (not buried under `style`). New channels share this shape so
 * the generic `diffSnapshots` helper can pair + compare any
 * channel uniformly.
 */
export interface DomElementSnapshot {
  /** Stable id for cross-demo pairing. Channel-specific shape: tick label text, header cell label, sidebar row's `data-row-id`, etc. */
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /** Leaf text content. Only set when the element renders text. */
  readonly text?: string;
  /** Only present if `options.computedStyle` was non-empty. */
  readonly style?: Readonly<Partial<Record<ComputedStyleKey, string>>>;
}

/**
 * Phase 20.5: per-channel selectors for reference + chronix. Centralized
 * here so each phase's snapshot helper doesn't re-derive them.
 * Reference-side selectors (reference) are sourced from `reference-dom-map.ts`
 * — DO NOT inline literal reference class names here.
 *
 * `null` for a channel means "this source doesn't have a stable
 * class selector — pass `options.labelRegex` instead". Currently
 * reference's tick + header text uses regex-based filtering.
 */
const CHRONIX_SELECTORS = {
  bar: '[data-bar-id]',
  bodyWrapper: 'svg.cx-gantt-body',
  tick: '.cx-gantt-tick-label',
  headerCell: '.cx-gantt-header-cell',
  sidebarRow: '.cx-gantt-sidebar-row',
  sidebarCell: '.cx-gantt-sidebar-cell',
} as const;

/**
 * Phase 20: normalize a `#rrggbb` hex string to the `rgb(R, G, B)`
 * shape `getComputedStyle().fill` returns. Used by cross-demo color
 * parity tests so a chronix `barBackgroundColor: '#3788d8'` prop
 * can be asserted against the browser-computed `rgb(55, 136, 216)`.
 *
 * Returns `null` for inputs that don't match `#rrggbb` (callers
 * compare normalized values directly so an unparseable expected
 * input fails the test loudly).
 */
export function hexToRgbString(hex: string): string | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return null;
  const h = m[1]!;
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Extracts bar bbox snapshots from either demo, normalized to a
 * common shape:
 *
 * - **reference**: queries `[data-event-id]`. Reference's bar `<g>` may contain
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
  source: 'reference' | 'chronix',
  chart: Locator,
  options?: SnapshotOptions,
): Promise<DomBarSnapshot[]> {
  const attrName = source === 'reference' ? 'data-event-id' : 'data-bar-id';
  // Phase 20.5: optional computed-style capture. When the caller
  // passes a non-empty `computedStyle` list, each bar's snapshot
  // gains a `style: { fill: '...', stroke: '...' }` map. Empty /
  // omitted = cheap path (no `getComputedStyle()` calls beyond the
  // existing `fill` read).
  const styleKeys = options?.computedStyle ?? [];
  // Bars are positioned in TIMELINE-BODY content space — relative to
  // the body wrapper's left edge (post-sidebar). The chart-root
  // Locator includes the sidebar, which differs in width between
  // demos (reference's resource panel ~288px at viewport 1440; chronix's
  // 3-column sidebar 240px). Measuring bar.left − chartRect.left
  // bakes the sidebar width into x, making the two demos disagree
  // by their sidebar-width delta. Measure relative to the body
  // wrapper instead so the axis x=0 anchor matches.
  const bodyWrapperSelector =
    source === 'reference' ? '.gantt-timeline-body-wrapper' : 'svg.cx-gantt-body';
  return chart.evaluate(
    (_root, { attrName: attr, bodySel, styleKeys: skList }) => {
      const bodyEl = document.querySelector(bodySel);
      const bodyRect = bodyEl?.getBoundingClientRect();
      if (!bodyRect) return [];
      // Phase 20: read computed `fill` from the bar's colored rect.
      // chronix's `[data-bar-id]` IS a `<rect>` with inline `fill=`;
      // reference's `[data-event-id]` is a `<g>` wrapping a child rect
      // whose fill is the bar color. Walk one child level when the
      // bar element itself isn't a rect. `getComputedStyle` returns
      // the painted color in normalized `rgb(R, G, B)` form so
      // inline-attribute vs CSS-class resolution doesn't matter.
      const resolveColoredTarget = (el: Element): Element => {
        if (el.tagName.toLowerCase() === 'rect') return el;
        const innerRect = el.querySelector('rect');
        return innerRect ?? el;
      };
      const readStyleMap = (el: Element): Record<string, string> => {
        const target = resolveColoredTarget(el);
        const cs = window.getComputedStyle(target);
        const map: Record<string, string> = {};
        for (const k of skList) map[k] = (cs as unknown as Record<string, string>)[k] ?? '';
        return map;
      };
      const out: {
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
        fill: string;
        style?: Record<string, string>;
      }[] = [];
      document.querySelectorAll<SVGElement>(`[${attr}]`).forEach((el) => {
        const id = el.getAttribute(attr) ?? '';
        const r = el.getBoundingClientRect();
        if (r.height < 4 || r.width < 1) return;
        const target = resolveColoredTarget(el);
        const fill = window.getComputedStyle(target).fill;
        const entry: (typeof out)[number] = {
          id,
          x: Math.round((r.left - bodyRect.left) * 100) / 100,
          y: Math.round((r.top - bodyRect.top) * 100) / 100,
          width: Math.round(r.width * 100) / 100,
          height: Math.round(r.height * 100) / 100,
          fill,
        };
        if (skList.length > 0) entry.style = readStyleMap(el);
        out.push(entry);
      });
      // Dedupe by id, widest wins — reference bars may have inner-overlay
      // children (progress triangle, resize handles) that also carry
      // the data-event-id attribute.
      const widest = new Map<string, (typeof out)[number]>();
      for (const b of out) {
        const prev = widest.get(b.id);
        if (!prev || b.width > prev.width) widest.set(b.id, b);
      }
      return [...widest.values()];
    },
    { attrName, bodySel: bodyWrapperSelector, styleKeys: [...styleKeys] },
  );
}

/**
 * **Phase 20.5: extract tick labels.** Each axis tick rendered in
 * the header band produces one snapshot entry with the leaf text
 * (`"0时"`, `"15日三"`, etc.) and its bbox relative to the body
 * wrapper.
 *
 * - chronix: queries `.cx-gantt-tick-label`
 * - reference: walks leaf `<text>` elements inside the header wrapper,
 *   filters by `options.labelRegex` (reference's tick text has no stable
 *   class — caller passes the format regex like `/^\d+时$/`)
 *
 * The `id` field carries the leaf text — fits the cross-demo
 * pairing pattern when the same tick label appears on both sides.
 * When labels repeat (e.g. week-view "0时" appears 7 times across
 * 7 days), the `id` is augmented with a position suffix:
 * `"0时#0"`, `"0时#1"`, etc., so dedup-by-id doesn't collapse them.
 */
export function extractTicksSnapshot(
  source: 'reference' | 'chronix',
  chart: Locator,
  options?: SnapshotOptions,
): Promise<DomElementSnapshot[]> {
  const styleKeys = options?.computedStyle ?? [];
  const labelPattern = options?.labelRegex?.source ?? null;
  const labelFlags = options?.labelRegex?.flags ?? '';
  const chronixTickSel = CHRONIX_SELECTORS.tick;
  const chronixBodySel = CHRONIX_SELECTORS.bodyWrapper;
  return chart.evaluate(
    (_root, { src, tickSel, bodySel, pattern, flags, skList }) => {
      const bodyEl = document.querySelector(bodySel);
      const bodyRect = bodyEl?.getBoundingClientRect();
      if (!bodyRect) return [];
      const readStyleMap = (el: Element): Record<string, string> => {
        const cs = window.getComputedStyle(el);
        const map: Record<string, string> = {};
        for (const k of skList) map[k] = (cs as unknown as Record<string, string>)[k] ?? '';
        return map;
      };
      // Collect `(text, element)` pairs honoring source-specific
      // selection. chronix uses a stable class; reference walks leaf
      // text nodes filtered by regex.
      const pairs: { text: string; el: Element }[] = [];
      if (src === 'chronix') {
        document.querySelectorAll<Element>(tickSel).forEach((el) => {
          const t = el.textContent?.trim() ?? '';
          if (pattern && !new RegExp(pattern, flags).test(t)) return;
          pairs.push({ text: t, el });
        });
      } else {
        // reference: walk leaf nodes, regex-match, then walk up to the
        // first ancestor with a non-zero rendered width (SVG
        // `<title>` children are 0×0 and shouldn't be measured).
        const re = pattern ? new RegExp(pattern, flags) : null;
        document.querySelectorAll('*').forEach((node) => {
          if (node.children.length > 0) return;
          const t = node.textContent?.trim() ?? '';
          if (!t) return;
          if (re && !re.test(t)) return;
          let candidate: Element | null = node;
          while (candidate) {
            const rr = candidate.getBoundingClientRect();
            if (rr.width > 0 && rr.height > 0) {
              pairs.push({ text: t, el: candidate });
              return;
            }
            candidate = candidate.parentElement;
          }
        });
      }
      // De-duplicate by `(rounded-left, text)` so labels that repeat
      // at distinct positions (week-view "0时" × 7) each contribute
      // their own snapshot entry. Then suffix the id with a 0-based
      // occurrence index to make each id unique for pair-by-id diff.
      const seen = new Set<string>();
      const dedup: { text: string; el: Element }[] = [];
      for (const p of pairs) {
        const r = p.el.getBoundingClientRect();
        const key = `${Math.round(r.left)}|${p.text}`;
        if (seen.has(key)) continue;
        seen.add(key);
        dedup.push(p);
      }
      // Sort by left edge so the occurrence-index suffix is
      // deterministic across runs.
      dedup.sort((a, b) => a.el.getBoundingClientRect().left - b.el.getBoundingClientRect().left);
      const perText = new Map<string, number>();
      const out: {
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
        text: string;
        style?: Record<string, string>;
      }[] = [];
      for (const p of dedup) {
        const r = p.el.getBoundingClientRect();
        const occ = perText.get(p.text) ?? 0;
        perText.set(p.text, occ + 1);
        const entry: (typeof out)[number] = {
          id: `${p.text}#${occ}`,
          x: Math.round((r.left - bodyRect.left) * 100) / 100,
          y: Math.round((r.top - bodyRect.top) * 100) / 100,
          width: Math.round(r.width * 100) / 100,
          height: Math.round(r.height * 100) / 100,
          text: p.text,
        };
        if (skList.length > 0) entry.style = readStyleMap(p.el);
        out.push(entry);
      }
      return out;
    },
    {
      src: source,
      tickSel: chronixTickSel,
      bodySel: chronixBodySel,
      pattern: labelPattern,
      flags: labelFlags,
      skList: [...styleKeys],
    },
  );
}

/**
 * **Phase 20.5: extract outer header-band cells.** Each header cell
 * (month band above day ticks, day band above hour ticks) produces
 * one snapshot entry with its label text + bbox.
 *
 * Same regex-fallback shape as `extractTicksSnapshot` since reference's
 * header cells use the same plain-`<text>`-leaf rendering pattern.
 */
export function extractHeaderCellsSnapshot(
  source: 'reference' | 'chronix',
  chart: Locator,
  options?: SnapshotOptions,
): Promise<DomElementSnapshot[]> {
  const styleKeys = options?.computedStyle ?? [];
  const labelPattern = options?.labelRegex?.source ?? null;
  const labelFlags = options?.labelRegex?.flags ?? '';
  const chronixSel = CHRONIX_SELECTORS.headerCell;
  const chronixBodySel = CHRONIX_SELECTORS.bodyWrapper;
  return chart.evaluate(
    (_root, { src, cellSel, bodySel, pattern, flags, skList }) => {
      const bodyEl = document.querySelector(bodySel);
      const bodyRect = bodyEl?.getBoundingClientRect();
      if (!bodyRect) return [];
      const readStyleMap = (el: Element): Record<string, string> => {
        const cs = window.getComputedStyle(el);
        const map: Record<string, string> = {};
        for (const k of skList) map[k] = (cs as unknown as Record<string, string>)[k] ?? '';
        return map;
      };
      const pairs: { text: string; el: Element }[] = [];
      if (src === 'chronix') {
        document.querySelectorAll<Element>(cellSel).forEach((el) => {
          const t = el.textContent?.trim() ?? '';
          if (pattern && !new RegExp(pattern, flags).test(t)) return;
          pairs.push({ text: t, el });
        });
      } else {
        const re = pattern ? new RegExp(pattern, flags) : null;
        document.querySelectorAll('*').forEach((node) => {
          if (node.children.length > 0) return;
          const t = node.textContent?.trim() ?? '';
          if (!t) return;
          if (re && !re.test(t)) return;
          let candidate: Element | null = node;
          while (candidate) {
            const rr = candidate.getBoundingClientRect();
            if (rr.width > 0 && rr.height > 0) {
              pairs.push({ text: t, el: candidate });
              return;
            }
            candidate = candidate.parentElement;
          }
        });
      }
      const seen = new Set<string>();
      const dedup: { text: string; el: Element }[] = [];
      for (const p of pairs) {
        const r = p.el.getBoundingClientRect();
        const key = `${Math.round(r.left)}|${p.text}`;
        if (seen.has(key)) continue;
        seen.add(key);
        dedup.push(p);
      }
      dedup.sort((a, b) => a.el.getBoundingClientRect().left - b.el.getBoundingClientRect().left);
      const perText = new Map<string, number>();
      const out: {
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
        text: string;
        style?: Record<string, string>;
      }[] = [];
      for (const p of dedup) {
        const r = p.el.getBoundingClientRect();
        const occ = perText.get(p.text) ?? 0;
        perText.set(p.text, occ + 1);
        const entry: (typeof out)[number] = {
          id: `${p.text}#${occ}`,
          x: Math.round((r.left - bodyRect.left) * 100) / 100,
          y: Math.round((r.top - bodyRect.top) * 100) / 100,
          width: Math.round(r.width * 100) / 100,
          height: Math.round(r.height * 100) / 100,
          text: p.text,
        };
        if (skList.length > 0) entry.style = readStyleMap(p.el);
        out.push(entry);
      }
      return out;
    },
    {
      src: source,
      cellSel: chronixSel,
      bodySel: chronixBodySel,
      pattern: labelPattern,
      flags: labelFlags,
      skList: [...styleKeys],
    },
  );
}

/**
 * **Phase 20.5: extract sidebar cells.** Each rendered sidebar cell
 * (resource panel `<td>` in reference; `.cx-gantt-sidebar-cell` in
 * chronix) produces one snapshot entry. Id is composed as
 * `${rowId}|${columnKey}` for chronix (both attrs always present
 * on rendered cells); reference uses `${rowId}#${cellIndex}` since reference
 * cells lack a column-id attribute.
 *
 * Coordinate frame: relative to the sidebar's own origin (NOT body
 * wrapper) — sidebar has its own left edge, separate from the
 * timeline body. Cross-demo column-width parity needs this frame
 * to be sidebar-local.
 */
export function extractSidebarSnapshot(
  source: 'reference' | 'chronix',
  chart: Locator,
  options?: SnapshotOptions,
): Promise<DomElementSnapshot[]> {
  const styleKeys = options?.computedStyle ?? [];
  const chronixRowSel = CHRONIX_SELECTORS.sidebarRow;
  const chronixCellSel = CHRONIX_SELECTORS.sidebarCell;
  return chart.evaluate(
    (_root, { src, rowSel, cellSel, skList }) => {
      const readStyleMap = (el: Element): Record<string, string> => {
        const cs = window.getComputedStyle(el);
        const map: Record<string, string> = {};
        for (const k of skList) map[k] = (cs as unknown as Record<string, string>)[k] ?? '';
        return map;
      };
      const out: {
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
        text: string;
        style?: Record<string, string>;
      }[] = [];
      // Anchor the coordinate frame to the FIRST row's leftmost
      // edge — chronix sidebar's `.cx-gantt-sidebar-row` and reference's
      // `tr[data-resource-id]` both share the panel's left edge,
      // so the first row's `left` is the sidebar origin.
      const firstRow = document.querySelector(rowSel);
      const sidebarLeft = firstRow?.getBoundingClientRect().left ?? 0;
      const sidebarTop = firstRow?.getBoundingClientRect().top ?? 0;
      if (src === 'chronix') {
        document.querySelectorAll<Element>(cellSel).forEach((el) => {
          const rowId = el.getAttribute('data-row-id') ?? '';
          const colKey = el.getAttribute('data-column-key') ?? '';
          const r = el.getBoundingClientRect();
          if (r.width < 1 || r.height < 1) return;
          const entry: (typeof out)[number] = {
            id: `${rowId}|${colKey}`,
            x: Math.round((r.left - sidebarLeft) * 100) / 100,
            y: Math.round((r.top - sidebarTop) * 100) / 100,
            width: Math.round(r.width * 100) / 100,
            height: Math.round(r.height * 100) / 100,
            text: el.textContent?.trim() ?? '',
          };
          if (skList.length > 0) entry.style = readStyleMap(el);
          out.push(entry);
        });
      } else {
        // reference: walk `tr[data-resource-id]` rows, then their `td`
        // children. Cells get id `${rowId}#${cellIndex}`.
        document.querySelectorAll<Element>(rowSel).forEach((row) => {
          const rowId = row.getAttribute('data-resource-id') ?? '';
          const cells = row.querySelectorAll('td');
          cells.forEach((cell, idx) => {
            const r = cell.getBoundingClientRect();
            if (r.width < 1 || r.height < 1) return;
            const entry: (typeof out)[number] = {
              id: `${rowId}#${idx}`,
              x: Math.round((r.left - sidebarLeft) * 100) / 100,
              y: Math.round((r.top - sidebarTop) * 100) / 100,
              width: Math.round(r.width * 100) / 100,
              height: Math.round(r.height * 100) / 100,
              text: cell.textContent?.trim() ?? '',
            };
            if (skList.length > 0) entry.style = readStyleMap(cell);
            out.push(entry);
          });
        });
      }
      return out;
    },
    {
      src: source,
      rowSel: source === 'chronix' ? chronixRowSel : 'tr[data-resource-id]',
      cellSel: chronixCellSel,
      skList: [...styleKeys],
    },
  );
}

/**
 * Phase 22: extract the toolbar widget set from either demo.
 *
 * Pairs by `buttonName` (derived from the `gantt-<name>-button` /
 * `cx-gantt-<name>-button` class regex). The title widget gets a
 * synthetic id `'title'`. Returns one entry per visible widget with:
 *
 * - `id`: `buttonName`
 * - `kind`: `'title' | 'view' | 'nav'` — view = one of `viewIds`,
 *   nav = `'prev' | 'next' | 'today'`, else title.
 * - `text`: `textContent.trim()` (empty for icon-only buttons)
 * - `isPressed`: `aria-pressed === 'true'`
 * - `x` / `y` / `width` / `height`: bounding box relative to the
 *   toolbar root's top-left edge (NOT page-absolute) — both demos'
 *   toolbar roots share the same coordinate frame.
 *
 * No computed-style extraction (toolbar styling diverges across
 * demos by design — chronix uses its own theme tokens; pixel diff
 * lives in chronix-self VRT, not cross-demo).
 */
export interface ToolbarWidgetSnapshot {
  readonly id: string;
  readonly kind: 'title' | 'view' | 'nav' | 'unknown';
  readonly text: string;
  readonly isPressed: boolean;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export async function extractToolbarSnapshot(
  source: 'reference' | 'chronix',
  page: Page,
): Promise<readonly ToolbarWidgetSnapshot[]> {
  const toolbarSel = source === 'reference' ? '.gantt-toolbar' : '.cx-gantt-toolbar';
  const buttonClassRe = '(?:^|\\s)(?:cx-)?gantt-(\\w+)-button(?:\\s|$)';
  return page.evaluate(
    ({ tbSel, classRe }) => {
      const re = new RegExp(classRe);
      const toolbar = document.querySelector(tbSel);
      if (!toolbar) return [];
      const tbRect = toolbar.getBoundingClientRect();
      const out: {
        id: string;
        kind: 'title' | 'view' | 'nav' | 'unknown';
        text: string;
        isPressed: boolean;
        x: number;
        y: number;
        width: number;
        height: number;
      }[] = [];

      // Title widget — reference: `<h2.gantt-toolbar-title>`; chronix:
      // `<h2.cx-gantt-toolbar-title>`. There's at most one per
      // toolbar.
      const titleEl = toolbar.querySelector('h2[class*="-toolbar-title"]');
      if (titleEl) {
        const r = titleEl.getBoundingClientRect();
        out.push({
          id: 'title',
          kind: 'title',
          text: titleEl.textContent?.trim() ?? '',
          isPressed: false,
          x: Math.round((r.left - tbRect.left) * 100) / 100,
          y: Math.round((r.top - tbRect.top) * 100) / 100,
          width: Math.round(r.width * 100) / 100,
          height: Math.round(r.height * 100) / 100,
        });
      }

      // Buttons — match any `<button>` whose class list contains a
      // `(?:cx-)?gantt-<name>-button` token. Extract `<name>` via
      // regex; classify against the known view + nav names.
      const viewNames = new Set(['day', 'week', 'month', 'season', 'halfYear', 'year']);
      const navNames = new Set(['prev', 'next', 'today']);
      toolbar.querySelectorAll('button').forEach((btn) => {
        const cls = btn.getAttribute('class') ?? '';
        const m = re.exec(cls);
        if (!m) return;
        const name = m[1]!;
        const r = btn.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) return;
        const kind: 'title' | 'view' | 'nav' | 'unknown' = viewNames.has(name)
          ? 'view'
          : navNames.has(name)
            ? 'nav'
            : 'unknown';
        out.push({
          id: name,
          kind,
          text: btn.textContent?.trim() ?? '',
          isPressed: btn.getAttribute('aria-pressed') === 'true',
          x: Math.round((r.left - tbRect.left) * 100) / 100,
          y: Math.round((r.top - tbRect.top) * 100) / 100,
          width: Math.round(r.width * 100) / 100,
          height: Math.round(r.height * 100) / 100,
        });
      });

      return out;
    },
    { tbSel: toolbarSel, classRe: buttonClassRe },
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
  readonly referenceValue: number;
  readonly chronixValue: number;
  readonly delta: number;
}

export interface ParityDiff {
  readonly mismatches: readonly ParityMismatch[];
  /** Bar ids present in reference snapshot but missing from chronix. */
  readonly onlyInReference: readonly string[];
  /** Bar ids present in chronix snapshot but missing from reference. */
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
 * mismatch occurs when `|reference - chronix| > tolerance`.
 *
 * Tolerance defaults to 1 px per channel. Pass
 * `{ y: Infinity, height: Infinity }` to skip those channels (the
 * standard cross-demo bar parity tolerance in v0 because chronix
 * doesn't replicate reference's resource-grouping row order).
 *
 * Bars present in only one snapshot are NOT mismatches by default —
 * they're reported separately via `onlyInReference` / `onlyInChronix` so
 * the calling test can decide whether to fail on missing pairs.
 */
export function diffBarsSnapshots(
  reference: readonly DomBarSnapshot[],
  chronix: readonly DomBarSnapshot[],
  tolerance: ParityTolerance = {},
): ParityDiff {
  const tol: Required<ParityTolerance> = {
    x: tolerance.x ?? DEFAULT_TOLERANCE.x,
    y: tolerance.y ?? DEFAULT_TOLERANCE.y,
    width: tolerance.width ?? DEFAULT_TOLERANCE.width,
    height: tolerance.height ?? DEFAULT_TOLERANCE.height,
  };

  const referenceById = new Map(reference.map((b) => [b.id, b]));
  const chronixById = new Map(chronix.map((b) => [b.id, b]));

  const mismatches: ParityMismatch[] = [];
  const onlyInReference: string[] = [];
  const onlyInChronix: string[] = [];

  for (const [id, referenceBar] of referenceById) {
    const chronixBar = chronixById.get(id);
    if (!chronixBar) {
      onlyInReference.push(id);
      continue;
    }
    for (const field of ['x', 'y', 'width', 'height'] as const) {
      const fieldTol = tol[field];
      if (!Number.isFinite(fieldTol)) continue;
      const delta = Math.abs(referenceBar[field] - chronixBar[field]);
      if (delta > fieldTol) {
        mismatches.push({
          barId: id,
          field,
          referenceValue: referenceBar[field],
          chronixValue: chronixBar[field],
          delta,
        });
      }
    }
  }
  for (const id of chronixById.keys()) {
    if (!referenceById.has(id)) onlyInChronix.push(id);
  }

  return { mismatches, onlyInReference, onlyInChronix };
}

/**
 * Formats a parity diff as a multi-line string suitable for
 * `console.warn` or assertion-failure messages. Groups mismatches by
 * bar id; appends onlyInReference / onlyInChronix lists.
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
          `    ${m.field}: reference=${m.referenceValue} chronix=${m.chronixValue} Δ=${m.delta.toFixed(2)}`,
        );
      }
    }
  }

  if (diff.onlyInReference.length > 0) {
    lines.push(
      `Bars only in original DOM (${diff.onlyInReference.length}): ${diff.onlyInReference.join(', ')}`,
    );
  }
  if (diff.onlyInChronix.length > 0) {
    lines.push(
      `Bars only in chronix DOM (${diff.onlyInChronix.length}): ${diff.onlyInChronix.join(', ')}`,
    );
  }

  return lines.length === 0 ? 'parity OK (no mismatches)' : lines.join('\n');
}

/**
 * **Phase 20.5: per-channel tolerance for the generic `diffSnapshots`.**
 *
 * Numeric channels (x / y / width / height) accept a `number` =
 * max-allowed-px-delta OR `Infinity` to skip the channel. The
 * `text` channel is checked for exact equality unless set to
 * `'skip'`. The `style` channel accepts a per-style-key map:
 * `'exact'` enforces string equality (most colors / cursor names /
 * font families), `'skip'` ignores the key, and `number` enables
 * numeric tolerance for keys whose values parse as px / unitless
 * numbers (e.g. `fontSize: 1` allows ±1px on the parsed font-size).
 */
export interface SnapshotTolerance {
  readonly x?: number;
  readonly y?: number;
  readonly width?: number;
  readonly height?: number;
  readonly text?: 'exact' | 'skip';
  readonly style?: Readonly<Partial<Record<ComputedStyleKey, number | 'exact' | 'skip'>>>;
}

export interface SnapshotMismatch {
  readonly id: string;
  /** Channel name: `'x'` / `'y'` / `'width'` / `'height'` / `'text'` / `'style.<key>'`. */
  readonly field: string;
  readonly referenceValue: unknown;
  readonly chronixValue: unknown;
  readonly delta?: number;
}

export interface SnapshotDiff {
  readonly mismatches: readonly SnapshotMismatch[];
  readonly onlyInReference: readonly string[];
  readonly onlyInChronix: readonly string[];
}

const DEFAULT_SNAPSHOT_TOLERANCE: Required<
  Pick<SnapshotTolerance, 'x' | 'y' | 'width' | 'height' | 'text'>
> = {
  x: 1,
  y: 1,
  width: 1,
  height: 1,
  text: 'exact',
};

/**
 * **Phase 20.5: generic per-channel diff over `DomElementSnapshot` pairs.**
 *
 * Pairs by `id`. For each paired element, walks every numeric +
 * `text` + `style` channel and records a `SnapshotMismatch` when
 * the per-channel tolerance is exceeded. Channels with `Infinity`
 * (numeric) or `'skip'` (text/style) tolerance are bypassed
 * entirely.
 *
 * The `'style.<key>'` field naming in `SnapshotMismatch.field`
 * lets the caller surface a single style-key mismatch (e.g.
 * `'style.fill'`) without having to flatten the snapshot itself.
 *
 * Bars present on only one side are NOT mismatches — they're
 * reported via `onlyInReference` / `onlyInChronix` so the calling test
 * can decide whether to hard-fail on missing pairs.
 */
export function diffSnapshots(
  reference: readonly DomElementSnapshot[],
  chronix: readonly DomElementSnapshot[],
  tolerance: SnapshotTolerance = {},
): SnapshotDiff {
  const tol = { ...DEFAULT_SNAPSHOT_TOLERANCE, ...tolerance };
  const styleTol = tolerance.style ?? {};
  const referenceById = new Map(reference.map((b) => [b.id, b]));
  const chronixById = new Map(chronix.map((b) => [b.id, b]));

  const mismatches: SnapshotMismatch[] = [];
  const onlyInReference: string[] = [];
  const onlyInChronix: string[] = [];

  for (const [id, referenceEl] of referenceById) {
    const chronixEl = chronixById.get(id);
    if (!chronixEl) {
      onlyInReference.push(id);
      continue;
    }
    // Numeric channels.
    for (const field of ['x', 'y', 'width', 'height'] as const) {
      const fieldTol = tol[field];
      if (!Number.isFinite(fieldTol)) continue;
      const delta = Math.abs(referenceEl[field] - chronixEl[field]);
      if (delta > fieldTol) {
        mismatches.push({
          id,
          field,
          referenceValue: referenceEl[field],
          chronixValue: chronixEl[field],
          delta,
        });
      }
    }
    // Text channel.
    if (tol.text !== 'skip' && (referenceEl.text !== undefined || chronixEl.text !== undefined)) {
      if (referenceEl.text !== chronixEl.text) {
        mismatches.push({
          id,
          field: 'text',
          referenceValue: referenceEl.text,
          chronixValue: chronixEl.text,
        });
      }
    }
    // Style channel: per-key comparison driven by the tolerance map.
    // Only fields that appear in at least one of the two snapshots
    // are checked — if neither side captured a style key, there's
    // nothing to compare.
    const allStyleKeys = new Set<string>([
      ...(referenceEl.style ? Object.keys(referenceEl.style) : []),
      ...(chronixEl.style ? Object.keys(chronixEl.style) : []),
    ]);
    for (const key of allStyleKeys) {
      const keyTol = styleTol[key as ComputedStyleKey];
      if (keyTol === 'skip') continue;
      const kv = referenceEl.style?.[key as ComputedStyleKey];
      const cv = chronixEl.style?.[key as ComputedStyleKey];
      if (kv === cv) continue;
      if (typeof keyTol === 'number') {
        // Numeric tolerance: parse both sides as floats; mismatch
        // if either parse fails OR delta exceeds tolerance.
        const kn = Number.parseFloat(kv ?? '');
        const cn = Number.parseFloat(cv ?? '');
        if (Number.isFinite(kn) && Number.isFinite(cn)) {
          const delta = Math.abs(kn - cn);
          if (delta <= keyTol) continue;
          mismatches.push({
            id,
            field: `style.${key}`,
            referenceValue: kv,
            chronixValue: cv,
            delta,
          });
          continue;
        }
      }
      // Default = exact equality (covers `'exact'` and undefined-
      // tolerance cases).
      mismatches.push({
        id,
        field: `style.${key}`,
        referenceValue: kv,
        chronixValue: cv,
      });
    }
  }
  for (const id of chronixById.keys()) {
    if (!referenceById.has(id)) onlyInChronix.push(id);
  }

  return { mismatches, onlyInReference, onlyInChronix };
}

/**
 * **Phase 20.5: human-readable diff string for the generic diff.**
 * Mirrors `formatParityDiff` shape but for `SnapshotDiff`.
 */
export function formatSnapshotDiff(diff: SnapshotDiff): string {
  const lines: string[] = [];

  if (diff.mismatches.length > 0) {
    lines.push(`${diff.mismatches.length} element-field mismatch(es):`);
    const byId = new Map<string, SnapshotMismatch[]>();
    for (const m of diff.mismatches) {
      const list = byId.get(m.id) ?? [];
      list.push(m);
      byId.set(m.id, list);
    }
    for (const [id, ms] of byId) {
      lines.push(`  ${id}:`);
      for (const m of ms) {
        const deltaPart = m.delta !== undefined ? ` Δ=${m.delta.toFixed(2)}` : '';
        lines.push(
          `    ${m.field}: reference=${String(m.referenceValue)} chronix=${String(m.chronixValue)}${deltaPart}`,
        );
      }
    }
  }

  if (diff.onlyInReference.length > 0) {
    lines.push(
      `Elements only in original DOM (${diff.onlyInReference.length}): ${diff.onlyInReference.join(', ')}`,
    );
  }
  if (diff.onlyInChronix.length > 0) {
    lines.push(
      `Elements only in chronix DOM (${diff.onlyInChronix.length}): ${diff.onlyInChronix.join(', ')}`,
    );
  }

  return lines.length === 0 ? 'parity OK (no mismatches)' : lines.join('\n');
}

// ─── Phase 20.7: cross-demo screenshot capture ─────────────────────

/**
 * **Phase 20.7: page-chrome-hide CSS for the screenshot target.**
 *
 * Both demos have surrounding HTML chrome (page header, sidebar
 * panel, parity-mode banner on chronix) that should NOT contribute
 * to the captured rect. Injects source-specific CSS that hides the
 * chrome AND forces the timeline-body wrapper to `width: max-content`
 * so wider-than-viewport views (week ~8736 px, year ~24000 px)
 * rasterize fully via `locator.screenshot()`.
 *
 * reference selectors are interpolated from `reference-dom-map.ts`
 * exports so chronix source code never carries the literal original
 * class names.
 */
async function hidePageChrome(page: Page, source: 'reference' | 'chronix'): Promise<void> {
  if (source === 'chronix') {
    await page.addStyleTag({
      content: `
        body { background: #ffffff !important; margin: 0 !important; }
        .cx-demo-side, .cx-demo-header, .cx-demo-parity-banner { display: none !important; }
        .cx-demo-app { display: block !important; width: auto !important; }
        .cx-demo-main { padding: 0 !important; overflow: visible !important; }
        .cx-demo-svg-frame { border: 0 !important; max-height: none !important; overflow: visible !important; width: max-content !important; }
        .cx-gantt-wrapper { max-height: none !important; overflow: visible !important; width: max-content !important; }
        svg.cx-gantt-body { overflow: visible !important; }
      `,
    });
  } else {
    // reference side. Selector source: `reference-dom-map.ts` exports.
    // We deliberately do NOT name surrounding demo-shell classes
    // here (original demo's outer page chrome is not enumerated in
    // reference-dom-map). Screenshotting the wrapper Locator
    // directly already excludes anything outside its bounding box;
    // the body bg + margin reset + wrapper `width: max-content` are
    // enough.
    await page.addStyleTag({
      content: `
        body { background: #ffffff !important; margin: 0 !important; }
        ${TIMELINE_BODY_WRAPPER} { overflow: visible !important; width: max-content !important; }
      `,
    });
  }
}

/**
 * **Phase 20.7: open one demo and capture the timeline-body screenshot.**
 *
 * Targets the body-wrapper element (not the chart-root) so the
 * sidebar — which has different widths in the two demos (reference
 * resource panel ~288 px, chronix sidebar 240 px) — is excluded
 * from the captured rect.
 *
 * Per-source URL composition:
 * - `'reference'`: navigates to `REFERENCE_DEMO_URL/` with no query flags. reference
 *   demo doesn't yet expose Phase 20.6's URL-config layer; cross
 *   scenarios with chronix-side URL flags rely on reference's default
 *   rendering already matching what those flags produce in chronix
 *   parity mode (e.g. `priorityCallback=true` in parity mode produces
 *   the same palette reference ships by default). Errors loudly when
 *   called for a `kind: 'vrt'` scenario (vrt has no reference side).
 * - `'chronix'`: navigates to `CHRONIX_DEMO_URL/?<flags>`. For
 *   `kind: 'cross'`, prepends `parity=true&` to put chronix into
 *   reference-equivalent data state. For `kind: 'vrt'`, applies the
 *   scenario's flags verbatim (no parity prepend).
 *
 * Side effects: opens a fresh `BrowserContext` per call, installs
 * `FROZEN_TIME_ISO` clock BEFORE navigation, applies view-toggle
 * click after page load, injects `hidePageChrome` CSS, then
 * `locator.screenshot()` on the body wrapper. Context is closed in
 * `finally` so callers don't leak browser resources.
 *
 * Returns the PNG buffer. Caller pixel-diffs via
 * `expect(buffer).toMatchSnapshot(...)` against the appropriate
 * baseline file resolved by `crossDemoBaselineRelPath(scenario)`.
 */
export async function captureCrossDemoScreenshot(
  source: 'reference' | 'chronix',
  browser: Browser,
  scenario: CrossDemoScenario,
): Promise<Buffer> {
  if (source === 'reference' && scenario.kind !== 'cross') {
    throw new Error(
      `captureCrossDemoScreenshot: cannot capture reference side for scenario "${scenario.id}" (kind="${scenario.kind}"). VRT scenarios are chronix-only.`,
    );
  }

  const baseURL = source === 'reference' ? REFERENCE_DEMO_URL : CHRONIX_DEMO_URL;

  // Compose the navigation path. reference has no URL config layer; chronix
  // gets parity-prepended for cross scenarios, raw flags for vrt.
  let urlPath = '/';
  if (source === 'chronix') {
    const flags =
      scenario.kind === 'cross'
        ? scenario.urlQuery.length > 0
          ? `parity=true&${scenario.urlQuery}`
          : 'parity=true'
        : scenario.urlQuery;
    if (flags.length > 0) urlPath = `/?${flags}`;
  }

  const bodySelector = source === 'reference' ? TIMELINE_BODY_WRAPPER : 'svg.cx-gantt-body';

  const context: BrowserContext = await browser.newContext({
    baseURL,
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    timezoneId: 'Asia/Shanghai',
    locale: 'zh-CN',
  });
  try {
    const page = await context.newPage();

    // Frozen clock BEFORE navigation so module-load `new Date()` calls
    // in the demos see the frozen epoch.
    await page.clock.install({ time: new Date(FROZEN_TIME_ISO) });
    await page.goto(urlPath);

    // Wait for body to mount (signal that initial layout ran).
    const bodyLocator = page.locator(bodySelector);
    await bodyLocator.waitFor({ state: 'visible' });
    await page.waitForLoadState('networkidle');
    await settle(page);

    // Click view-toggle button. reference's toggle cluster lives inside
    // the chart-root; chronix's is at the page level. Both share
    // zh-CN labels via `VIEW_TOGGLE_LABEL`.
    const toggleLabel = VIEW_TOGGLE_LABEL[scenario.viewId];
    const toggleHost = source === 'reference' ? page.locator(CHART_SELECTOR) : page;
    await toggleHost.getByRole('button', { name: toggleLabel, exact: true }).click();
    await settle(page);

    // Hide page chrome + expand wrapper to natural content width.
    await hidePageChrome(page, source);
    await settle(page);

    return await bodyLocator.screenshot();
  } finally {
    await context.close();
  }
}
