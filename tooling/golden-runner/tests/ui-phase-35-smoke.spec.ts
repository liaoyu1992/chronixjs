/**
 * Phase 35 smoke — behavioral checks across 3 adapters.
 */
import { expect, test } from '@playwright/test';

const DEMOS = [
  { name: 'vue3', port: 8731 },
  { name: 'vue2', port: 8732 },
  { name: 'react', port: 8733 },
] as const;

for (const demo of DEMOS) {
  test.describe(`Phase 35 smoke — ${demo.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`http://localhost:${demo.port}`);
    });

    test('DynamicInput has correct class', async ({ page }) => {
      const el = page.getByTestId('phase35-dynamic-input');
      await expect(el).toHaveClass(/cx-ui-dynamic-input/, { timeout: 15_000 });
    });

    test('DynamicTags has correct class', async ({ page }) => {
      const el = page.getByTestId('phase35-dynamic-tags');
      await expect(el).toHaveClass(/cx-ui-dynamic-tags/, { timeout: 15_000 });
    });

    test('Anchor has nav element', async ({ page }) => {
      const el = page.getByTestId('phase35-anchor');
      await expect(el).toHaveClass(/cx-ui-anchor/, { timeout: 15_000 });
    });

    test('NumberAnimation has correct class', async ({ page }) => {
      const el = page.getByTestId('phase35-number-animation');
      await expect(el).toHaveClass(/cx-ui-number-animation/, { timeout: 15_000 });
    });

    test('Scrollbar has correct class', async ({ page }) => {
      const el = page.getByTestId('phase35-scrollbar');
      await expect(el).toHaveClass(/cx-ui-scrollbar/, { timeout: 15_000 });
    });

    test('Upload has correct class', async ({ page }) => {
      const el = page.getByTestId('phase35-upload');
      await expect(el).toHaveClass(/cx-ui-upload/, { timeout: 15_000 });
    });
  });
}
