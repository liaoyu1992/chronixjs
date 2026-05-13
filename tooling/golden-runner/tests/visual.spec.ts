import { expect, test } from '@playwright/test';

import { CHART_SELECTOR, FROZEN_TIME_ISO } from '../src/config.js';
import { VISUAL_SCENARIOS } from '../src/scenarios.js';

test.describe('chronix gantt parity goldens (k-ui demo)', () => {
  for (const scenario of VISUAL_SCENARIOS) {
    test(scenario.id, async ({ page }) => {
      await page.clock.install({ time: new Date(FROZEN_TIME_ISO) });

      await page.goto('/');

      const chart = page.locator(CHART_SELECTOR);
      await chart.waitFor({ state: 'visible' });
      await page.waitForLoadState('networkidle');

      // Let the next frame settle so DPR-aware grid lines stop fighting layout.
      await page.evaluate(
        () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
      );

      await expect(chart).toHaveScreenshot(`${scenario.id}.png`);
    });
  }
});
