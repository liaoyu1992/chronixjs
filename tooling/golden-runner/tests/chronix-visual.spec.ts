import { expect, test } from '@playwright/test';

import { FROZEN_TIME_ISO } from '../src/config.js';
import { VISUAL_SCENARIOS } from '../src/scenarios.js';

import type { Page } from '@playwright/test';

/**
 * chronix-side visual baselines, captured against the chronix example
 * demo at port 8702 (separate from the parity reference at 8701).
 *
 * Capture target is `<div class="cx-gantt-wrapper">` — the new root
 * after the Phase 4.5 sticky-header refactor. The wrapper hosts a
 * header SVG and a body SVG; capturing the wrapper bundles both into
 * a single PNG. The wrapper is sized to its natural content (via
 * `width: max-content` injected below) so a wider-than-viewport view
 * (e.g. week's 8736-px axis or year's ~24000-px width) rasterizes in
 * full — `locator.screenshot()` honors the element's natural bbox.
 *
 * URL override: defaults to `http://localhost:8702/` but respects a
 * `CHRONIX_DEMO_URL` env var if set (e.g. when capturing against a
 * deployed staging build).
 */

const CHRONIX_DEMO_URL = process.env['CHRONIX_DEMO_URL'] ?? 'http://localhost:8702/';
const CHRONIX_WRAPPER_SELECTOR = 'div.cx-gantt-wrapper';
const CHRONIX_BODY_SELECTOR = 'svg.cx-gantt-body';

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

      // Wait on the body SVG (the one that always paints bars) — the
      // wrapper exists immediately but the body SVG appearing is the
      // signal that layout has run at least once.
      await page.locator(CHRONIX_BODY_SELECTOR).waitFor({ state: 'visible' });
      await page.waitForLoadState('networkidle');
      await settle(page);

      // Click the view-toggle button in the chronix demo's header.
      // chronix uses a plain `<button>` cluster, not headerToolbar.
      await page.getByRole('button', { name: toggleLabel, exact: true }).click();
      await settle(page);

      // Hide the demo's page chrome, then resize the wrapper div so its
      // bounding box hugs the gantt's natural content width. Without the
      // `width: max-content` override the wrapper is a block div whose
      // bbox clamps to viewport width — `locator.screenshot()` would
      // then capture only the leftmost slice of a wider-than-viewport
      // chart (week ~8736 px, year ~23725 px). The other overrides
      // strip `max-height: 70vh` and the `overflow: auto` scrollport so
      // the entire chart paints in flow and isn't clipped vertically.
      // No need to reset; the page is disposed after capture.
      await page.addStyleTag({
        content: `
          body { background: #ffffff !important; margin: 0 !important; }
          .cx-demo-side, .cx-demo-header { display: none !important; }
          .cx-demo-app { display: block !important; width: auto !important; }
          .cx-demo-main { padding: 0 !important; overflow: visible !important; }
          .cx-demo-svg-frame { border: 0 !important; max-height: none !important; overflow: visible !important; width: max-content !important; }
          .cx-gantt-wrapper { max-height: none !important; overflow: visible !important; width: max-content !important; }
        `,
      });
      await settle(page);

      const wrapper = page.locator(CHRONIX_WRAPPER_SELECTOR);
      await expect(wrapper).toHaveScreenshot(`chronix/${scenario.id}.png`);
    });
  }
});
