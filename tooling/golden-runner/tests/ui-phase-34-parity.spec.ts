/**
 * Phase 34 parity — Form + FormItem (2 components).
 *
 * Verifies each component's testid fingerprint renders in all 3 demos.
 */
import { expect, test } from '@playwright/test';

const DEMOS = [
  { name: 'vue3', port: 8731 },
  { name: 'vue2', port: 8732 },
  { name: 'react', port: 8733 },
] as const;

for (const demo of DEMOS) {
  test.describe(`Phase 34 parity — ${demo.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`http://localhost:${demo.port}`);
    });

    test('Form renders with testid', async ({ page }) => {
      const form = page.getByTestId('phase34-form');
      await expect(form).toBeAttached({ timeout: 15_000 });
    });

    test('FormItem renders with Name label', async ({ page }) => {
      const item = page.getByTestId('phase34-input-name');
      await expect(item).toBeAttached({ timeout: 15_000 });
    });
  });
}
