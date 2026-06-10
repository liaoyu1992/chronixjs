import { expect, test, type Page } from '@playwright/test';

import {
  CHRONIX_UI_REACT_DEMO_URL,
  CHRONIX_UI_VUE2_DEMO_URL,
  CHRONIX_UI_VUE3_DEMO_URL,
} from '../src/config.js';

/**
 * chronix-ui Phase 27 Popover-consuming Tier B behavioral smoke —
 * 2026-06-03, updated 2026-06-08. TARGETS-loop over 3 adapters.
 * Demos use toggle buttons (click to open) for Modal / Drawer / Dropdown.
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
  test.describe(`chronix-ui ${name} / Phase 27 Popover-consuming Tier B smoke`, () => {
    test.beforeEach(async ({ page }) => {
      await visitDemo(page, url);
    });

    test('Modal — wrapper + mask + panel with title + footer + tabindex', async ({ page }) => {
      // Open the modal via toggle button
      await page.getByTestId('phase27-modal-toggle').click();
      const wrapper = page.locator('.cx-ui-modal-wrapper.cx-ui-modal-wrapper--open');
      await expect(wrapper).toHaveCount(1);
      await expect(wrapper).toHaveClass(/cx-ui-modal-wrapper--with-mask/);
      await expect(wrapper.locator('.cx-ui-modal__mask')).toHaveCount(1);
      const panel = wrapper.locator('.cx-ui-modal');
      await expect(panel).toHaveCount(1);
      expect(await panel.getAttribute('tabindex')).toBe('-1');
      await expect(panel.locator('.cx-ui-modal__title')).toHaveText('Confirm action');
      await expect(panel.locator('.cx-ui-modal__footer')).toHaveCount(1);
    });

    test('Drawer — panel with --placement-right + close button + tabindex', async ({ page }) => {
      // Open the drawer via toggle button
      await page.getByTestId('phase27-drawer-toggle').click();
      const wrapper = page.locator('.cx-ui-drawer-wrapper.cx-ui-drawer-wrapper--open');
      await expect(wrapper).toHaveCount(1);
      await expect(wrapper).toHaveClass(/cx-ui-drawer-wrapper--placement-right/);
      const panel = wrapper.locator('.cx-ui-drawer.cx-ui-drawer--placement-right');
      await expect(panel).toHaveCount(1);
      expect(await panel.getAttribute('tabindex')).toBe('-1');
      const close = panel.locator('.cx-ui-drawer__close');
      await expect(close).toHaveCount(1);
      expect(await close.getAttribute('type')).toBe('button');
    });

    test('Dropdown — trigger span + portaled panel with 3 options + disabled', async ({ page }) => {
      // Dropdown is always shown (trigger="manual", show=true) for Playwright
      const trigger = page.getByTestId('phase27-dropdown');
      expect(await trigger.evaluate((el) => el.tagName)).toBe('SPAN');
      const panel = page.locator('.cx-ui-dropdown.cx-ui-dropdown--open');
      await expect(panel).toHaveCount(1);
      const options = panel.locator('.cx-ui-dropdown__option');
      await expect(options).toHaveCount(3);
      await expect(options.nth(2)).toHaveClass(/cx-ui-dropdown__option--disabled/);
    });

    test('Menu — root <ul> with --mode-vertical + pre-expanded submenu + active leaf', async ({
      page,
    }) => {
      const menu = page.getByTestId('phase27-menu');
      expect(await menu.evaluate((el) => el.tagName)).toBe('UL');
      await expect(menu).toHaveClass(/cx-ui-menu--mode-vertical/);
      const submenu = menu.locator('.cx-ui-menu__submenu');
      await expect(submenu).toHaveCount(1);
      const expandedItem = menu.locator('.cx-ui-menu__item--expanded');
      await expect(expandedItem).toHaveCount(1);
      const activeItem = menu.locator('.cx-ui-menu__item--active');
      await expect(activeItem).toHaveCount(1);
    });

    test('Affix — placeholder + inner content rendered', async ({ page }) => {
      const placeholder = page.getByTestId('phase27-affix');
      await expect(placeholder).toHaveClass(/cx-ui-affix-placeholder/);
      const inner = placeholder.locator('.cx-ui-affix');
      await expect(inner).toHaveCount(1);
    });

    test('BackTop — <button type=button> with chevron-up SVG icon', async ({ page }) => {
      const backTop = page.getByTestId('phase27-back-top');
      expect(await backTop.evaluate((el) => el.tagName)).toBe('BUTTON');
      expect(await backTop.getAttribute('type')).toBe('button');
      await expect(backTop.locator('.cx-ui-back-top__icon svg')).toHaveCount(1);
    });
  });
}
