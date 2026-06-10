/**
 * Phase 33 parity — ColorPicker / Transfer / Slider / Pagination (4 components).
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
  test.describe(`Phase 33 parity — ${demo.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`http://localhost:${demo.port}`);
    });

    test('ColorPicker renders with testid', async ({ page }) => {
      const cp = page.getByTestId('phase33-color-picker');
      await expect(cp).toBeAttached({ timeout: 15_000 });
    });

    test('Transfer renders with testid', async ({ page }) => {
      const tf = page.getByTestId('phase33-transfer');
      await expect(tf).toBeAttached({ timeout: 15_000 });
    });

    test('Slider renders with testid', async ({ page }) => {
      const sl = page.getByTestId('phase33-slider');
      await expect(sl).toBeAttached({ timeout: 15_000 });
    });

    test('Pagination renders with testid', async ({ page }) => {
      const pg = page.getByTestId('phase33-pagination');
      await expect(pg).toBeAttached({ timeout: 15_000 });
    });
  });
}
