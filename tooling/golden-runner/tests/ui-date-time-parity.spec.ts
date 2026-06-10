/**
 * Phase 32 parity — DatePicker / TimePicker / Calendar (3 components).
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
  test.describe(`Phase 32 parity — ${demo.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`http://localhost:${demo.port}`);
    });

    test('DatePicker renders with testid', async ({ page }) => {
      const dp = page.getByTestId('phase32-date-picker');
      await expect(dp).toBeAttached({ timeout: 15_000 });
    });

    test('TimePicker renders with testid', async ({ page }) => {
      const tp = page.getByTestId('phase32-time-picker');
      await expect(tp).toBeAttached({ timeout: 15_000 });
    });

    test('Calendar renders with testid', async ({ page }) => {
      const cal = page.getByTestId('phase32-calendar');
      await expect(cal).toBeAttached({ timeout: 15_000 });
    });
  });
}
