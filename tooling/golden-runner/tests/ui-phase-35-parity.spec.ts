/**
 * Phase 35 parity — 6 components (DynamicInput, DynamicTags, Anchor,
 * NumberAnimation, Scrollbar, Upload).
 */
import { expect, test } from '@playwright/test';

const DEMOS = [
  { name: 'vue3', port: 8731 },
  { name: 'vue2', port: 8732 },
  { name: 'react', port: 8733 },
] as const;

const TESTIDS = [
  'phase35-dynamic-input',
  'phase35-dynamic-tags',
  'phase35-anchor',
  'phase35-number-animation',
  'phase35-scrollbar',
  'phase35-upload',
] as const;

for (const demo of DEMOS) {
  test.describe(`Phase 35 parity — ${demo.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`http://localhost:${demo.port}`);
    });

    for (const testid of TESTIDS) {
      test(`${testid} renders`, async ({ page }) => {
        const el = page.getByTestId(testid);
        await expect(el).toBeAttached({ timeout: 15_000 });
      });
    }
  });
}
