/**
 * Phase 37 smoke — behavioral checks across 3 adapters.
 */
import { expect, test } from '@playwright/test';

const DEMOS = [
  { name: 'vue3', port: 8731 },
  { name: 'vue2', port: 8732 },
  { name: 'react', port: 8733 },
] as const;

for (const demo of DEMOS) {
  test.describe(`Phase 37 smoke — ${demo.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`http://localhost:${demo.port}`);
    });

    test('Carousel has lazy class', async ({ page }) => {
      const el = page.getByTestId('phase37-carousel-lazy');
      await expect(el).toHaveClass(/cx-ui-carousel/, { timeout: 15_000 });
    });

    test('Carousel has thumbnail strip', async ({ page }) => {
      const thumbs = page.locator('.cx-ui-carousel__thumbnails');
      await expect(thumbs.first()).toBeAttached({ timeout: 15_000 });
    });

    test('Tabs has correct class', async ({ page }) => {
      const el = page.getByTestId('phase37-tabs-editable');
      await expect(el).toHaveClass(/cx-ui-tabs/, { timeout: 15_000 });
    });

    test('Tabs has closable tab', async ({ page }) => {
      const closeBtn = page.locator('.cx-ui-tabs__tab-close');
      await expect(closeBtn.first()).toBeAttached({ timeout: 15_000 });
    });

    test('Tabs has add button', async ({ page }) => {
      const addBtn = page.locator('.cx-ui-tabs__add-btn');
      await expect(addBtn.first()).toBeAttached({ timeout: 15_000 });
    });

    test('Mention multi-source renders', async ({ page }) => {
      const el = page.getByTestId('phase37-mention-multi');
      await expect(el).toHaveClass(/cx-ui-mention/, { timeout: 15_000 });
    });
  });
}
