import { expect, test, type Page } from '@playwright/test';

import {
  CHRONIX_UI_REACT_DEMO_URL,
  CHRONIX_UI_VUE2_DEMO_URL,
  CHRONIX_UI_VUE3_DEMO_URL,
} from '../src/config.js';

/**
 * chronix-ui Phase 28 Layout family behavioral smoke — 2026-06-04.
 * TARGETS-loop over 3 adapters. Demos pre-populate controlled state +
 * fallback URLs so Playwright finds content at page load.
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
  test.describe(`chronix-ui ${name} / Phase 28 Layout family smoke`, () => {
    test.beforeEach(async ({ page }) => {
      await visitDemo(page, url);
    });

    test('Layout — outer container + auto-detected --has-sider modifier', async ({ page }) => {
      const layout = page.getByTestId('phase28-layout');
      await expect(layout).toHaveClass(/cx-ui-layout/);
      await expect(layout).toHaveClass(/cx-ui-layout--has-sider/);
      await expect(layout.locator('.cx-ui-layout__sider')).toHaveCount(1);
      await expect(layout.locator('.cx-ui-layout__header')).toHaveCount(1);
      await expect(layout.locator('.cx-ui-layout__content')).toHaveCount(1);
      await expect(layout.locator('.cx-ui-layout__footer')).toHaveCount(1);
    });

    test('Tabs — 3 tab buttons + active panel content', async ({ page }) => {
      const tabs = page.getByTestId('phase28-tabs');
      await expect(tabs).toHaveClass(/cx-ui-tabs--type-line/);
      const tabButtons = tabs.locator('[role="tab"]');
      await expect(tabButtons).toHaveCount(3);
      const activeTab = tabs.locator('.cx-ui-tabs__tab--active');
      await expect(activeTab).toHaveCount(1);
      await expect(tabs.locator('[role="tabpanel"]')).toContainText('Overview tab body');
    });

    test('Collapse — 3 items + one expanded by default', async ({ page }) => {
      const collapse = page.getByTestId('phase28-collapse');
      await expect(collapse).toHaveClass(/cx-ui-collapse--arrow-left/);
      const items = collapse.locator('.cx-ui-collapse__item');
      await expect(items).toHaveCount(3);
      await expect(collapse.locator('.cx-ui-collapse__item--expanded')).toHaveCount(1);
      await expect(collapse.locator('.cx-ui-collapse__item--disabled')).toHaveCount(1);
    });

    test('CollapseTransition — wrapper present with --expanded modifier', async ({ page }) => {
      const ct = page.getByTestId('phase28-collapse-transition');
      await expect(ct).toHaveClass(/cx-ui-collapse-transition/);
      await expect(ct).toHaveClass(/cx-ui-collapse-transition--expanded/);
    });

    test('Split — 2 panes + 1 bar with role=separator', async ({ page }) => {
      const split = page.getByTestId('phase28-split');
      await expect(split).toHaveClass(/cx-ui-split--direction-horizontal/);
      await expect(split.locator('.cx-ui-split__pane--first')).toHaveCount(1);
      await expect(split.locator('.cx-ui-split__pane--second')).toHaveCount(1);
      const bar = split.locator('.cx-ui-split__bar');
      await expect(bar).toHaveCount(1);
      expect(await bar.getAttribute('role')).toBe('separator');
    });

    test('Image — <img> with lazy + objectFit + cx-ui-image class', async ({ page }) => {
      const img = page.getByTestId('phase28-image');
      expect(await img.evaluate((el) => el.tagName)).toBe('IMG');
      await expect(img).toHaveClass(/cx-ui-image/);
      expect(await img.getAttribute('loading')).toBe('lazy');
    });

    test('FloatButton — fixed-position button with --shape-circle', async ({ page }) => {
      const btn = page.getByTestId('phase28-float-button');
      expect(await btn.evaluate((el) => el.tagName)).toBe('BUTTON');
      await expect(btn).toHaveClass(/cx-ui-float-button--shape-circle/);
      const styleAttr = await btn.getAttribute('style');
      expect(styleAttr ?? '').toContain('position: fixed');
    });

    test('FloatButtonGroup — static cluster with children container', async ({ page }) => {
      const group = page.getByTestId('phase28-float-button-group');
      await expect(group).toHaveClass(/cx-ui-float-button-group/);
      await expect(group).toHaveClass(/cx-ui-float-button-group--expanded/);
      await expect(group.locator('.cx-ui-float-button-group__children')).toHaveCount(1);
    });
  });
}
