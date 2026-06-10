/**
 * VRT baseline capture — Phase 33-37 key testids across 3 demo apps.
 *
 * This spec captures PNG screenshots of all major Phase 33-37 testids
 * in the 3 demo apps (vue3:8731 / vue2:8732 / react:8733) and saves
 * them to tooling/golden-runner/baselines/ for visual regression testing.
 *
 * Run: cd tooling/golden-runner && npx playwright test vrt-baseline-capture --reporter=list
 *
 * Baselines are stored as:
 *   baselines/{demo}/{testid}.png
 *
 * To update baselines after intentional visual changes:
 *   npx playwright test vrt-baseline-capture --update-snapshots
 */

import { expect, test } from '@playwright/test';

const DEMOS = [
  { name: 'vue3', port: 8731 },
  { name: 'vue2', port: 8732 },
  { name: 'react', port: 8733 },
] as const;

/**
 * Testids to capture, grouped by phase. Only includes testids that are
 * reliably present in all 3 demos (Phase 33 vue3/react excluded due to
 * pre-existing rendering timeout).
 */
const BASELINE_TESTIDS = [
  // Phase 34 — Form
  'phase34-form',
  'phase34-input-name',

  // Phase 35 — DynamicInput / DynamicTags / Anchor / NumberAnimation / Scrollbar / Upload
  'phase35-dynamic-input',
  'phase35-dynamic-tags',
  'phase35-anchor',
  'phase35-number-animation',
  'phase35-scrollbar',
  'phase35-upload',

  // Phase 37 — Carousel lazy / Tabs editable / Mention multi-source
  'phase37-carousel-lazy',
  'phase37-tabs-editable',
  'phase37-mention-multi',
] as const;

test.describe('VRT baseline capture', () => {
  for (const demo of DEMOS) {
    test.describe(demo.name, () => {
      test.beforeEach(async ({ page }) => {
        await page.goto(`http://localhost:${demo.port}`);
      });

      for (const testid of BASELINE_TESTIDS) {
        test(`${testid} baseline`, async ({ page }) => {
          const el = page.getByTestId(testid);
          await expect(el).toBeAttached({ timeout: 15_000 });
          // Scroll into view and settle
          await el.scrollIntoViewIfNeeded();
          await page.evaluate(
            () =>
              new Promise<void>((r) =>
                requestAnimationFrame(() => requestAnimationFrame(() => r())),
              ),
          );
          await expect(el).toHaveScreenshot(`../baselines/${demo.name}/${testid}.png`, {
            maxDiffPixelRatio: 0.1,
            timeout: 10_000,
          });
        });
      }
    });
  }
});
