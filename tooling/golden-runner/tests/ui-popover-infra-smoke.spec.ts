import { expect, test, type Page } from '@playwright/test';

import {
  CHRONIX_UI_REACT_DEMO_URL,
  CHRONIX_UI_VUE2_DEMO_URL,
  CHRONIX_UI_VUE3_DEMO_URL,
} from '../src/config.js';

/**
 * chronix-ui Phase 26 Popover infra behavioral smoke — 2026-06-03.
 * TARGETS-loop over 3 adapters. Demos use controlled `show=true` so
 * popups are rendered at page load.
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
  test.describe(`chronix-ui ${name} / Phase 26 Popover infra smoke`, () => {
    test.beforeEach(async ({ page }) => {
      await visitDemo(page, url);
    });

    test('Popover — trigger span + portaled popup with --open + content', async ({ page }) => {
      const trigger = page.getByTestId('phase26-popover');
      expect(await trigger.evaluate((el) => el.tagName)).toBe('SPAN');
      await expect(trigger).toHaveClass(/cx-ui-popover__trigger/);
      const popup = page.locator('.cx-ui-popover.cx-ui-popover--open');
      await expect(popup).toHaveCount(1);
      await expect(popup).toContainText('Popover body content');
    });

    test('Tooltip — trigger span + portaled tooltip with --top + content text', async ({
      page,
    }) => {
      const trigger = page.getByTestId('phase26-tooltip');
      expect(await trigger.evaluate((el) => el.tagName)).toBe('SPAN');
      const tooltip = page.locator('.cx-ui-tooltip.cx-ui-tooltip--open');
      await expect(tooltip).toHaveCount(1);
      await expect(tooltip).toHaveClass(/cx-ui-tooltip--top/);
      await expect(tooltip).toHaveText('Tooltip text');
    });

    test('Popconfirm — title + 2 buttons (Keep + Delete) with type=button', async ({ page }) => {
      const trigger = page.getByTestId('phase26-popconfirm');
      expect(await trigger.evaluate((el) => el.tagName)).toBe('SPAN');
      const popconfirm = page.locator('.cx-ui-popconfirm.cx-ui-popconfirm--open');
      await expect(popconfirm).toHaveCount(1);
      await expect(popconfirm.locator('.cx-ui-popconfirm__title')).toHaveText('Delete this item?');
      const actions = popconfirm.locator('.cx-ui-popconfirm__action');
      await expect(actions).toHaveCount(2);
      await expect(actions.nth(0)).toHaveText('Keep');
      await expect(actions.nth(1)).toHaveText('Delete');
      await expect(actions.nth(1)).toHaveClass(/cx-ui-popconfirm__action--positive/);
      for (let i = 0; i < 2; i++) {
        expect(await actions.nth(i).getAttribute('type')).toBe('button');
      }
    });

    test('Popconfirm — SVG warning icon present in header', async ({ page }) => {
      const icon = page.locator('svg.cx-ui-popconfirm__icon');
      await expect(icon).toHaveCount(1);
    });

    test('PopSelect — 3 options + first one is --active', async ({ page }) => {
      const trigger = page.getByTestId('phase26-pop-select');
      expect(await trigger.evaluate((el) => el.tagName)).toBe('SPAN');
      const popSelect = page.locator('.cx-ui-pop-select.cx-ui-pop-select--open');
      await expect(popSelect).toHaveCount(1);
      const options = popSelect.locator('.cx-ui-pop-select__option');
      await expect(options).toHaveCount(3);
      await expect(options.first()).toHaveClass(/cx-ui-pop-select__option--active/);
      await expect(options.nth(2)).toHaveClass(/cx-ui-pop-select__option--disabled/);
    });
  });
}
