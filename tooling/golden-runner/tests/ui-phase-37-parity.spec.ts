/**
 * Phase 37 parity — Carousel lazy+thumbnails, Tabs editable, Mention multi-source.
 */
import { expect, test } from '@playwright/test';

const DEMOS = [
  { name: 'vue3', port: 8731 },
  { name: 'vue2', port: 8732 },
  { name: 'react', port: 8733 },
] as const;

const TESTIDS = [
  'phase37-carousel-lazy',
  'phase37-tabs-editable',
  'phase37-mention-multi',
] as const;

for (const demo of DEMOS) {
  test.describe(`Phase 37 parity — ${demo.name}`, () => {
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
