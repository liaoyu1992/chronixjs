/**
 * Phase 32 smoke — DatePicker / TimePicker / Calendar structural checks.
 *
 * Verifies component-specific DOM structure across all 3 adapters.
 */
import { expect, test } from '@playwright/test';

const DEMOS = [
  { name: 'vue3', port: 8731 },
  { name: 'vue2', port: 8732 },
  { name: 'react', port: 8733 },
] as const;

for (const demo of DEMOS) {
  test.describe(`Phase 32 smoke — ${demo.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`http://localhost:${demo.port}`);
    });

    // DatePicker: root has cx-ui-date-picker class
    test('DatePicker has BEM root class', async ({ page }) => {
      const dp = page.getByTestId('phase32-date-picker');
      await expect(dp).toBeAttached({ timeout: 15_000 });
      await expect(dp).toHaveClass(/cx-ui-date-picker/);
    });

    // TimePicker: root has cx-ui-time-picker class
    test('TimePicker has BEM root class', async ({ page }) => {
      const tp = page.getByTestId('phase32-time-picker');
      await expect(tp).toBeAttached({ timeout: 15_000 });
      await expect(tp).toHaveClass(/cx-ui-time-picker/);
    });

    // Calendar: root has cx-ui-calendar class
    test('Calendar has BEM root class', async ({ page }) => {
      const cal = page.getByTestId('phase32-calendar');
      await expect(cal).toBeAttached({ timeout: 15_000 });
      await expect(cal).toHaveClass(/cx-ui-calendar/);
    });
  });
}
