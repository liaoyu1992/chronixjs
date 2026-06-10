/**
 * Phase 33 smoke — ColorPicker / Transfer / Slider / Pagination structural checks.
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
  test.describe(`Phase 33 smoke — ${demo.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`http://localhost:${demo.port}`);
    });

    // ColorPicker: root has cx-ui-color-picker class
    test('ColorPicker has BEM root class', async ({ page }) => {
      const cp = page.getByTestId('phase33-color-picker');
      await expect(cp).toBeAttached({ timeout: 15_000 });
      await expect(cp).toHaveClass(/cx-ui-color-picker/);
    });

    // ColorPicker: trigger element present
    test('ColorPicker has trigger element', async ({ page }) => {
      const cp = page.getByTestId('phase33-color-picker');
      await expect(cp).toBeAttached({ timeout: 15_000 });
      await expect(cp.locator('[data-testid="color-picker-trigger"]')).toBeAttached();
    });

    // Transfer: root has cx-ui-transfer class
    test('Transfer has BEM root class', async ({ page }) => {
      const tf = page.getByTestId('phase33-transfer');
      await expect(tf).toBeAttached({ timeout: 15_000 });
      await expect(tf).toHaveClass(/cx-ui-transfer/);
    });

    // Transfer: source + target panels present
    test('Transfer has source and target panels', async ({ page }) => {
      const tf = page.getByTestId('phase33-transfer');
      await expect(tf).toBeAttached({ timeout: 15_000 });
      await expect(tf.locator('[data-testid="transfer-source"]')).toBeAttached();
      await expect(tf.locator('[data-testid="transfer-target"]')).toBeAttached();
    });

    // Slider: root has cx-ui-slider class
    test('Slider has BEM root class', async ({ page }) => {
      const sl = page.getByTestId('phase33-slider');
      await expect(sl).toBeAttached({ timeout: 15_000 });
      await expect(sl).toHaveClass(/cx-ui-slider/);
    });

    // Slider: track + thumb present
    test('Slider has track and thumb', async ({ page }) => {
      const sl = page.getByTestId('phase33-slider');
      await expect(sl).toBeAttached({ timeout: 15_000 });
      await expect(sl.locator('[data-testid="slider-track"]')).toBeAttached();
      await expect(sl.locator('[data-testid="slider-thumb"]')).toBeAttached();
    });

    // Pagination: root has cx-ui-pagination class
    test('Pagination has BEM root class', async ({ page }) => {
      const pg = page.getByTestId('phase33-pagination');
      await expect(pg).toBeAttached({ timeout: 15_000 });
      await expect(pg).toHaveClass(/cx-ui-pagination/);
    });

    // Pagination: prev + next buttons present
    test('Pagination has prev/next buttons', async ({ page }) => {
      const pg = page.getByTestId('phase33-pagination');
      await expect(pg).toBeAttached({ timeout: 15_000 });
      await expect(pg.locator('[data-testid="pagination-prev"]')).toBeAttached();
      await expect(pg.locator('[data-testid="pagination-next"]')).toBeAttached();
    });

    // Pagination: page-1 button present
    test('Pagination has page buttons', async ({ page }) => {
      const pg = page.getByTestId('phase33-pagination');
      await expect(pg).toBeAttached({ timeout: 15_000 });
      await expect(pg.locator('[data-testid="pagination-page-1"]')).toBeAttached();
    });
  });
}
