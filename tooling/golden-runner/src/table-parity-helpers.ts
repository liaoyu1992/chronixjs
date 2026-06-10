/**
 * **Phase 113: chronix-table per-adapter VRT capture helpers.**
 *
 * Parallel structure to gantt's `captureCrossDemoScreenshot`. Key
 * differences:
 *
 * - No reference (AG Grid) side; chronix-table is chronix-only (A.1).
 * - 3 separate adapter demo URLs (vue3 / vue2 / react), each
 *   overridable via env var. Demo ports: 8711 / 8712 / 8713 (see
 *   `examples/table-{vue3,vue2,react}/vite.config.ts`).
 * - No `parity=true` URL flag; the table demos don't have a parity
 *   data-mode toggle layer. State is reached via DOM interactions
 *   inside the scenario's `setup(page)` hook.
 * - No frozen clock; the table demos render static sample data
 *   that doesn't depend on `new Date()` at render time. (If a
 *   future scenario needs frozen time, lift via a scenario-level
 *   `frozenTime?: string` field + conditional `page.clock.install`.)
 *
 * The capture targets `.demo-page__table:first-of-type` — the
 * primary table section in all 3 demos. This section ships with the
 * widest feature surface enabled (filter row + footer row + column
 * visibility menu + header menu + context menu + selection column +
 * pagination + cell range + undo history), so most of the v1
 * 8-scenario set drives state inside it. Two scenarios target
 * specific sub-sections (`#tool-panel-section`); those are handled
 * by `scrollIntoViewIfNeeded()` inside the scenario's `setup`.
 *
 * Each capture opens a fresh `BrowserContext` per scenario (no
 * cross-scenario state leakage); the context is closed in
 * `finally` so callers don't leak browser resources.
 */

import { VIEWPORT } from './config.js';

import type { TableAdapter, TableVrtScenario } from './table-cross-demo-scenarios.js';
import type { Browser, BrowserContext, Page } from '@playwright/test';

/** vue3 table demo URL (env override: `CHRONIX_TABLE_VUE3_DEMO_URL`). */
export const CHRONIX_TABLE_VUE3_DEMO_URL =
  process.env['CHRONIX_TABLE_VUE3_DEMO_URL'] ?? 'http://localhost:8711/';

/** vue2 table demo URL (env override: `CHRONIX_TABLE_VUE2_DEMO_URL`). */
export const CHRONIX_TABLE_VUE2_DEMO_URL =
  process.env['CHRONIX_TABLE_VUE2_DEMO_URL'] ?? 'http://localhost:8712/';

/** react table demo URL (env override: `CHRONIX_TABLE_REACT_DEMO_URL`). */
export const CHRONIX_TABLE_REACT_DEMO_URL =
  process.env['CHRONIX_TABLE_REACT_DEMO_URL'] ?? 'http://localhost:8713/';

export function tableDemoUrlFor(adapter: TableAdapter): string {
  switch (adapter) {
    case 'vue3':
      return CHRONIX_TABLE_VUE3_DEMO_URL;
    case 'vue2':
      return CHRONIX_TABLE_VUE2_DEMO_URL;
    case 'react':
      return CHRONIX_TABLE_REACT_DEMO_URL;
  }
}

/**
 * Hide page chrome (demo header, sidebar nav, parity banner) +
 * neutralise body background so the captured PNG matches the
 * `<ChronixTable>` element bounds without leaked demo-app pixels.
 *
 * Per `feedback_vrt_screenshots.md`: chronix VRT baselines target
 * the table element directly + inject CSS to hide the demo shell so
 * bbox-overlap pixels don't leak in.
 */
async function hideTableDemoChrome(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      body { background: #ffffff !important; margin: 0 !important; }
      .demo-page__header, .demo-page__nav { display: none !important; }
      .demo-page > * + * { display: none !important; }
      .demo-page > .demo-page__table:first-of-type { display: block !important; }
      .demo-page__table:first-of-type { padding: 0 !important; }
    `,
  });
}

/**
 * **Phase 113: capture the primary demo table screenshot.**
 *
 * 1. Open fresh `BrowserContext` with frozen viewport + zh-CN locale.
 * 2. Navigate to `${adapterBaseURL}/`.
 * 3. Wait for `.cx-table-wrapper` to mount.
 * 4. Wait for `networkidle` (demos may lazy-load sample data).
 * 5. Run scenario's `setup(page)`.
 * 6. `await page.waitForTimeout(150)` settle for async state.
 * 7. Hide page chrome.
 * 8. Capture `.demo-page__table:first-of-type` Locator screenshot.
 *
 * `tool-panel-columns-open` scenario uses `scrollIntoViewIfNeeded`
 * INSIDE its `setup` to bring its target subsection into view, then
 * the captured element is still `.demo-page__table:first-of-type`
 * (which scrolled past). For that one scenario, the capture target
 * is overridden via the optional `captureSelector` knob (future
 * extension; v1 captures the primary section for all scenarios).
 */
export async function captureTableVrtScreenshot(
  adapter: TableAdapter,
  browser: Browser,
  scenario: TableVrtScenario,
): Promise<Buffer> {
  const baseURL = tableDemoUrlFor(adapter);

  const context: BrowserContext = await browser.newContext({
    baseURL,
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    timezoneId: 'Asia/Shanghai',
    locale: 'zh-CN',
  });
  try {
    const page = await context.newPage();
    await page.goto('/');

    const tableWrapper = page.locator('.cx-table-wrapper').first();
    await tableWrapper.waitFor({ state: 'visible' });
    await page.waitForLoadState('networkidle');

    await scenario.setup(page);

    // Brief settle for any async state transitions kicked off in
    // `setup` (sort recompute, menu animation, validator dispatch).
    await page.waitForTimeout(150);

    await hideTableDemoChrome(page);
    await page.waitForTimeout(50);

    const captureTarget = page.locator('.demo-page__table:first-of-type');
    return await captureTarget.screenshot();
  } finally {
    await context.close();
  }
}
