import { expect, test } from '@playwright/test';

import { FROZEN_TIME_ISO } from '../src/config.js';
import { VISUAL_SCENARIOS } from '../src/scenarios.js';

import type { Page } from '@playwright/test';

/**
 * chronix-side visual baselines, captured against the chronix example
 * demo at port 8702 (separate from the parity reference at 8701).
 *
 * The screenshot target is the `<svg class="cx-gantt">` element
 * directly — NOT a chart-pane wrapper. The reference's pane has
 * `overflow: hidden` so wider-than-viewport content gets clipped at
 * the right edge; capturing the SVG itself lets the screenshot
 * include the full content (e.g. week view's 8736-px-wide axis or
 * year view's ~24000-px width). The browser still rasterizes the
 * element at its natural bounding-box size regardless of viewport.
 *
 * URL override: defaults to `http://localhost:8702/` but respects a
 * `CHRONIX_DEMO_URL` env var if set (e.g. when capturing against a
 * deployed staging build).
 */

const CHRONIX_DEMO_URL = process.env['CHRONIX_DEMO_URL'] ?? 'http://localhost:8702/';
const CHRONIX_SVG_SELECTOR = 'svg.cx-gantt';

const settle = (page: Page) =>
  page.evaluate(
    () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
  );

test.describe('chronix gantt visual goldens (chronix demo at 8702)', () => {
  for (const scenario of VISUAL_SCENARIOS) {
    // The chronix demo doesn't have a `week-default` baseline yet — its
    // initial load is `day` view. Skip scenarios that have no
    // `viewToggleLabel` since they don't fit chronix's view-toggle UI.
    const toggleLabel = scenario.viewToggleLabel;
    if (toggleLabel === undefined) continue;

    test(scenario.id, async ({ page }) => {
      await page.clock.install({ time: new Date(FROZEN_TIME_ISO) });

      await page.goto(CHRONIX_DEMO_URL);

      const svg = page.locator(CHRONIX_SVG_SELECTOR);
      await svg.waitFor({ state: 'visible' });
      await page.waitForLoadState('networkidle');
      await settle(page);

      // Click the view-toggle button in the chronix demo's header.
      // chronix uses a plain `<button>` cluster, not headerToolbar.
      await page.getByRole('button', { name: toggleLabel, exact: true }).click();
      await settle(page);

      // Reset the demo's scroll wrapper so the screenshot starts at x=0.
      // The wrapper is `.cx-demo-svg-frame`; without this the SVG's
      // bounding-box origin would shift if a prior interaction scrolled.
      await page.evaluate(() => {
        const frame = document.querySelector('.cx-demo-svg-frame');
        if (frame instanceof HTMLElement) {
          frame.scrollLeft = 0;
          frame.scrollTop = 0;
        }
      });
      await settle(page);

      await expect(svg).toHaveScreenshot(`chronix/${scenario.id}.png`);
    });
  }
});
