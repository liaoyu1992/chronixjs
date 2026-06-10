import { expect, test, type Page } from '@playwright/test';

import {
  CHRONIX_UI_REACT_DEMO_URL,
  CHRONIX_UI_VUE2_DEMO_URL,
  CHRONIX_UI_VUE3_DEMO_URL,
} from '../src/config.js';

/**
 * chronix-ui PageHeader + Breadcrumb behavioral smoke — Phase 19
 * (2026-06-02). TARGETS-loop pattern over 3 adapters.
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
  test.describe(`chronix-ui ${name} / Phase 19 Info-arch smoke`, () => {
    test.beforeEach(async ({ page }) => {
      await visitDemo(page, url);
    });

    // ------------------------------------------------------------------
    // PageHeader
    // ------------------------------------------------------------------

    test('PageHeader default renders title + subtitle text', async ({ page }) => {
      const ph = page.getByTestId('page-header-default');
      await expect(ph).toHaveClass(/cx-ui-page-header--with-title/);
      await expect(ph).toHaveClass(/cx-ui-page-header--with-subtitle/);
      await expect(ph.locator('.cx-ui-page-header__title')).toHaveText('Project A');
      await expect(ph.locator('.cx-ui-page-header__subtitle')).toHaveText('Owned by you');
    });

    test('PageHeader --with-back renders __back-button + aria-label', async ({ page }) => {
      const ph = page.getByTestId('page-header-with-back');
      await expect(ph).toHaveClass(/cx-ui-page-header--with-back/);
      const button = ph.locator('.cx-ui-page-header__back-button');
      await expect(button).toBeVisible();
      await expect(button).toHaveAttribute('aria-label', 'Back');
      await expect(button).toHaveAttribute('type', 'button');
      await expect(button).toHaveText('←');
    });

    test('PageHeader back-button click increments counter (verifying event emission)', async ({
      page,
    }) => {
      const counter = page.getByTestId('counter-page-header-back');
      await expect(counter).toHaveText('0');
      await page
        .getByTestId('page-header-with-back')
        .locator('.cx-ui-page-header__back-button')
        .click();
      await expect(counter).toHaveText('1');
      // A second click on the "full" page-header back-button also increments.
      await page.getByTestId('page-header-full').locator('.cx-ui-page-header__back-button').click();
      await expect(counter).toHaveText('2');
    });

    test('PageHeader --inverted applies the modifier class', async ({ page }) => {
      const ph = page.getByTestId('page-header-inverted');
      await expect(ph).toHaveClass(/cx-ui-page-header--inverted/);
    });

    test('PageHeader --with-extra renders __extra section with action buttons', async ({
      page,
    }) => {
      const ph = page.getByTestId('page-header-with-extra');
      await expect(ph).toHaveClass(/cx-ui-page-header--with-extra/);
      const extraButtons = ph.locator('.cx-ui-page-header__extra button.cx-ui-button');
      await expect(extraButtons).toHaveCount(2);
      await expect(extraButtons.first()).toHaveText('Cancel');
      await expect(extraButtons.last()).toHaveText('Save');
    });

    test('PageHeader fully populated carries all 7 with-* modifiers', async ({ page }) => {
      const ph = page.getByTestId('page-header-full');
      for (const modifier of [
        '--with-back',
        '--with-avatar',
        '--with-title',
        '--with-subtitle',
        '--with-extra',
        '--with-footer',
        '--with-content',
      ]) {
        await expect(ph).toHaveClass(new RegExp(`cx-ui-page-header${modifier}`));
      }
      await expect(ph.locator('.cx-ui-page-header__footer')).toContainText(
        'Tabs: Overview / Details / History',
      );
      await expect(ph.locator('.cx-ui-page-header__content')).toContainText(
        'Body content rendered between heading and footer.',
      );
    });

    // ------------------------------------------------------------------
    // Breadcrumb
    // ------------------------------------------------------------------

    test('Breadcrumb basic — item count + separator count formula', async ({ page }) => {
      const bc = page.getByTestId('breadcrumb-basic');
      await expect(bc.locator('.cx-ui-breadcrumb__item')).toHaveCount(3);
      await expect(bc.locator('.cx-ui-breadcrumb__separator')).toHaveCount(2);
      await expect(bc.locator('.cx-ui-breadcrumb__separator').first()).toHaveText('/');
    });

    test('Breadcrumb basic — href items render as <a href=...>', async ({ page }) => {
      const bc = page.getByTestId('breadcrumb-basic');
      const homeItem = bc.locator('.cx-ui-breadcrumb__item').nth(0);
      await expect(homeItem).toHaveAttribute('href', '/');
      await expect(homeItem).toHaveClass(/cx-ui-breadcrumb__item--clickable/);
      const docsItem = bc.locator('.cx-ui-breadcrumb__item').nth(1);
      await expect(docsItem).toHaveAttribute('href', '/docs');
    });

    test('Breadcrumb basic — trailing non-clickable item is current span', async ({ page }) => {
      const bc = page.getByTestId('breadcrumb-basic');
      const currentItem = bc.locator('.cx-ui-breadcrumb__item').nth(2);
      await expect(currentItem).toHaveClass(/cx-ui-breadcrumb__item--current/);
      await expect(currentItem).not.toHaveClass(/cx-ui-breadcrumb__item--clickable/);
    });

    test('Breadcrumb custom-sep renders ">" separator + --custom-separator class', async ({
      page,
    }) => {
      const bc = page.getByTestId('breadcrumb-custom-sep');
      await expect(bc).toHaveClass(/cx-ui-breadcrumb--custom-separator/);
      await expect(bc.locator('.cx-ui-breadcrumb__separator').first()).toHaveText('>');
    });

    test('Breadcrumb single — zero separators when items has only one entry', async ({ page }) => {
      const bc = page.getByTestId('breadcrumb-single');
      await expect(bc.locator('.cx-ui-breadcrumb__item')).toHaveCount(1);
      await expect(bc.locator('.cx-ui-breadcrumb__separator')).toHaveCount(0);
    });

    test('Breadcrumb clickable — clickable item triggers item-click event', async ({ page }) => {
      const counter = page.getByTestId('counter-breadcrumb-click');
      await expect(counter).toHaveText('0');
      // SPA item — clickable without href.
      await page
        .getByTestId('breadcrumb-clickable')
        .locator('.cx-ui-breadcrumb__item--clickable')
        .first()
        .click();
      await expect(counter).toHaveText('1');
    });

    test('Breadcrumb clickable — non-clickable item does NOT trigger item-click', async ({
      page,
    }) => {
      const counter = page.getByTestId('counter-breadcrumb-click');
      const startValue = await counter.textContent();
      const startCount = Number(startValue ?? '0');
      // Last item in the single-item breadcrumb is non-clickable.
      await page.getByTestId('breadcrumb-single').locator('.cx-ui-breadcrumb__item').click();
      await expect(counter).toHaveText(String(startCount));
    });

    // ------------------------------------------------------------------
    // Style injection — each component injects exactly one <style>
    // ------------------------------------------------------------------

    test('PageHeader + Breadcrumb stylesheets injected exactly once each', async ({ page }) => {
      expect(await page.locator('style[data-chronix-ui="page-header"]').count()).toBe(1);
      expect(await page.locator('style[data-chronix-ui="breadcrumb"]').count()).toBe(1);
    });
  });
}
