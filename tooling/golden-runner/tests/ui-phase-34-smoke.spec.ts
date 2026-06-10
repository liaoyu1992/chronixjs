/**
 * Phase 34 smoke — Form behavioral checks across 3 adapters.
 *
 * Verifies form rendering, label presence, and asterisk for required fields.
 */
import { expect, test } from '@playwright/test';

const DEMOS = [
  { name: 'vue3', port: 8731 },
  { name: 'vue2', port: 8732 },
  { name: 'react', port: 8733 },
] as const;

for (const demo of DEMOS) {
  test.describe(`Phase 34 smoke — ${demo.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`http://localhost:${demo.port}`);
    });

    test('Form has cx-ui-form class', async ({ page }) => {
      const form = page.getByTestId('phase34-form');
      await expect(form).toBeAttached({ timeout: 15_000 });
      await expect(form).toHaveClass(/cx-ui-form/);
    });

    test('Form has left-label modifier', async ({ page }) => {
      const form = page.getByTestId('phase34-form');
      await expect(form).toHaveClass(/cx-ui-form--left-label/);
    });

    test('Name input exists', async ({ page }) => {
      const input = page.getByTestId('phase34-input-name');
      await expect(input).toBeAttached({ timeout: 15_000 });
    });

    test('Email input exists', async ({ page }) => {
      const input = page.getByTestId('phase34-input-email');
      await expect(input).toBeAttached({ timeout: 15_000 });
    });

    test('Required asterisk visible for Name field', async ({ page }) => {
      const asterisk = page.locator('.cx-ui-form-item-label__asterisk').first();
      await expect(asterisk).toBeAttached({ timeout: 15_000 });
    });

    test('Form item has correct BEM class', async ({ page }) => {
      const item = page.locator('.cx-ui-form-item').first();
      await expect(item).toBeAttached({ timeout: 15_000 });
    });
  });
}
