import { expect, test } from '@playwright/test';

import { FROZEN_TIME_ISO } from '../src/config.js';
import { CHRONIX_REACT_DEMO_URL } from '../src/parity-helpers.js';
import { VISUAL_SCENARIOS } from '../src/scenarios.js';

import type { Page } from '@playwright/test';

const CHRONIX_WRAPPER_SELECTOR = 'div.cx-gantt-wrapper';
const CHRONIX_BODY_SELECTOR = 'svg.cx-gantt-body';

const settle = (page: Page) =>
  page.evaluate(
    () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
  );

test.describe('chronix gantt visual goldens (chronix-react demo at 8704)', () => {
  for (const scenario of VISUAL_SCENARIOS) {
    const toggleLabel = scenario.viewToggleLabel;
    if (toggleLabel === undefined) continue;

    test(scenario.id, async ({ page }) => {
      await page.clock.install({ time: new Date(FROZEN_TIME_ISO) });

      await page.goto(CHRONIX_REACT_DEMO_URL);

      await page.locator(CHRONIX_BODY_SELECTOR).waitFor({ state: 'visible' });
      await page.waitForLoadState('networkidle');
      await settle(page);

      await page.getByRole('button', { name: toggleLabel, exact: true }).click();
      await settle(page);

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
      await expect(wrapper).toHaveScreenshot(`chronix-react/${scenario.id}.png`);
    });
  }
});
