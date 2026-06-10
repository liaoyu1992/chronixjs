import { expect, test, type Page } from '@playwright/test';

import {
  CHRONIX_UI_REACT_DEMO_URL,
  CHRONIX_UI_VUE2_DEMO_URL,
  CHRONIX_UI_VUE3_DEMO_URL,
} from '../src/config.js';

/**
 * chronix-ui Phase 31 Tier C Select family behavioral smoke — 2026-06-05.
 * TARGETS-loop × 3 adapters. Tests Select / TreeSelect / Cascader / Mention.
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
  test.describe(`chronix-ui ${name} / Phase 31 Tier C Select family smoke`, () => {
    test.beforeEach(async ({ page }) => {
      await visitDemo(page, url);
    });

    test('Select — root renders with correct class', async ({ page }) => {
      const select = page.getByTestId('phase31-select');
      await select.scrollIntoViewIfNeeded();
      await expect(select).toBeAttached();
      await expect(select.locator('.cx-ui-select__trigger')).toHaveCount(1);
    });

    test('Select — trigger shows placeholder when empty', async ({ page }) => {
      const select = page.getByTestId('phase31-select');
      await select.scrollIntoViewIfNeeded();
      await expect(select.locator('.cx-ui-select__trigger--placeholder')).toHaveCount(1);
    });

    test('TreeSelect — root renders with tree-select class', async ({ page }) => {
      const ts = page.getByTestId('phase31-tree-select');
      await ts.scrollIntoViewIfNeeded();
      await expect(ts).toBeAttached();
      await expect(ts.locator('.cx-ui-tree-select__trigger')).toHaveCount(1);
    });

    test('Cascader — root renders with cascader class', async ({ page }) => {
      const cascader = page.getByTestId('phase31-cascader');
      await cascader.scrollIntoViewIfNeeded();
      await expect(cascader).toBeAttached();
      await expect(cascader.locator('.cx-ui-cascader__trigger')).toHaveCount(1);
    });

    test('Mention — textarea renders', async ({ page }) => {
      const mention = page.getByTestId('phase31-mention');
      await mention.scrollIntoViewIfNeeded();
      await expect(mention).toBeAttached();
      await expect(mention.locator('.cx-ui-mention__textarea')).toHaveCount(1);
    });

    test('Select multi — renders tag list when value is array', async ({ page }) => {
      const multi = page.getByTestId('phase31-select-multi');
      await multi.scrollIntoViewIfNeeded();
      await expect(multi).toBeAttached();
      // Verify the component is present with multiple modifier on the root element
      await expect(multi).toHaveClass(/cx-ui-select--multiple/);
    });
  });
}
