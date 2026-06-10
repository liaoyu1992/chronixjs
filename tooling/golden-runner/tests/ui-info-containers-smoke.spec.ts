import { expect, test, type Page } from '@playwright/test';

import {
  CHRONIX_UI_REACT_DEMO_URL,
  CHRONIX_UI_VUE2_DEMO_URL,
  CHRONIX_UI_VUE3_DEMO_URL,
} from '../src/config.js';

/**
 * chronix-ui Alert + Card + Empty behavioral smoke — Phase 15
 * (2026-06-02). One spec covering all 3 adapters.
 */

interface AdapterTarget {
  readonly name: string;
  readonly url: string;
}

const TARGETS: readonly AdapterTarget[] = [
  { name: 'vue3', url: CHRONIX_UI_VUE3_DEMO_URL },
  { name: 'vue2', url: CHRONIX_UI_VUE2_DEMO_URL },
  { name: 'react', url: CHRONIX_UI_REACT_DEMO_URL },
];

async function visitDemo(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await expect(page.getByTestId('demo-page')).toBeVisible();
}

for (const { name, url } of TARGETS) {
  test.describe(`chronix-ui ${name} / Phase 15 Alert+Card+Empty smoke`, () => {
    test.beforeEach(async ({ page }) => {
      await visitDemo(page, url);
    });

    test('all 5 Alert types render with matching --type modifier + role="alert"', async ({
      page,
    }) => {
      for (const t of ['default', 'info', 'success', 'warning', 'error'] as const) {
        const alert = page.getByTestId(`alert-${t}`);
        await expect(alert).toBeVisible();
        await expect(alert).toHaveAttribute('role', 'alert');
        await expect(alert).toHaveClass(new RegExp(`cx-ui-alert--${t}`));
      }
    });

    test('Alert title renders inside __title element', async ({ page }) => {
      const alert = page.getByTestId('alert-info');
      await expect(alert.locator('.cx-ui-alert__title')).toHaveText('Info');
      await expect(alert).toHaveClass(/cx-ui-alert--with-title/);
    });

    test('closable Alert renders __close button with aria-label', async ({ page }) => {
      const close = page.getByTestId('alert-closable').locator('.cx-ui-alert__close');
      await expect(close).toBeVisible();
      await expect(close).toHaveAttribute('aria-label', 'Close');
    });

    test('Card title renders inside __header element', async ({ page }) => {
      const card = page.getByTestId('card-basic');
      await expect(card.locator('.cx-ui-card__header')).toHaveText('Basic');
      await expect(card).toHaveClass(/cx-ui-card--with-title/);
    });

    test('Card with footer renders __footer and --with-footer modifier', async ({ page }) => {
      const card = page.getByTestId('card-with-footer');
      await expect(card).toHaveClass(/cx-ui-card--with-footer/);
      await expect(card.locator('.cx-ui-card__footer')).toBeVisible();
      // The footer slot is rendered with a button inside.
      await expect(card.locator('.cx-ui-card__footer button.cx-ui-button')).toHaveText('OK');
    });

    test('hoverable + embedded Card variants render their modifiers', async ({ page }) => {
      await expect(page.getByTestId('card-hoverable')).toHaveClass(/cx-ui-card--hoverable/);
      await expect(page.getByTestId('card-embedded')).toHaveClass(/cx-ui-card--embedded/);
    });

    test('default Empty renders icon + description + with-description modifier', async ({
      page,
    }) => {
      const empty = page.getByTestId('empty-default');
      await expect(empty).toHaveClass(/cx-ui-empty--with-description/);
      await expect(empty.locator('.cx-ui-empty__icon')).toBeVisible();
      await expect(empty.locator('.cx-ui-empty__description')).toHaveText('No data');
    });

    test('Empty with extra slot renders __extra + --with-extra modifier', async ({ page }) => {
      const empty = page.getByTestId('empty-with-action');
      await expect(empty).toHaveClass(/cx-ui-empty--with-extra/);
      await expect(empty.locator('.cx-ui-empty__extra button')).toHaveText('Add row');
    });

    test('Alert + Card + Empty stylesheets injected exactly once each', async ({ page }) => {
      expect(await page.locator('style[data-chronix-ui="alert"]').count()).toBe(1);
      expect(await page.locator('style[data-chronix-ui="card"]').count()).toBe(1);
      expect(await page.locator('style[data-chronix-ui="empty"]').count()).toBe(1);
    });
  });
}
