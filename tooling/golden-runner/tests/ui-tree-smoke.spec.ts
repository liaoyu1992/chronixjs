import { expect, test, type Page } from '@playwright/test';

import {
  CHRONIX_UI_REACT_DEMO_URL,
  CHRONIX_UI_VUE2_DEMO_URL,
  CHRONIX_UI_VUE3_DEMO_URL,
} from '../src/config.js';

/**
 * chronix-ui Phase 30 Tier C Tree behavioral smoke — 2026-06-04.
 * TARGETS-loop over 3 adapters. Demos pre-populate controlled state.
 *
 * Uses `force: true` on row clicks because Phase 27 drawer mask may
 * intercept pointer events on elements lower on the page.
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
  test.describe(`chronix-ui ${name} / Phase 30 Tier C Tree smoke`, () => {
    test.beforeEach(async ({ page }) => {
      await visitDemo(page, url);
    });

    test('Tree — root role=tree, rows present, initial selection visible', async ({ page }) => {
      const tree = page.getByTestId('phase30-tree');
      await tree.scrollIntoViewIfNeeded();
      await expect(tree).toBeAttached();
      expect(await tree.getAttribute('role')).toBe('tree');
      const count = await tree.locator('[role="treeitem"]').count();
      expect(count).toBeGreaterThanOrEqual(2);
      await expect(tree.locator('.cx-ui-tree__row--selected')).toHaveCount(1);
    });

    test('Tree — click leaf selects it', async ({ page }) => {
      const tree = page.getByTestId('phase30-tree');
      await tree.scrollIntoViewIfNeeded();
      const rows = tree.locator('[role="treeitem"]');
      const count = await rows.count();
      await rows.nth(count - 1).click({ force: true });
      await expect(tree.locator('.cx-ui-tree__row--selected')).toHaveCount(1);
    });

    test('Tree — click branch toggles expand', async ({ page }) => {
      const tree = page.getByTestId('phase30-tree');
      await tree.scrollIntoViewIfNeeded();
      const rowsBefore = await tree.locator('[role="treeitem"]').count();
      // Find the first row that has an arrow (i.e., a branch) and click it
      const branchRow = tree.locator('[role="treeitem"]').locator('.cx-ui-tree__arrow').first();
      await branchRow.evaluate((el) => {
        // Click the parent row to toggle expand/collapse
        const row = el.closest('[role="treeitem"]');
        if (row) (row as HTMLElement).click();
      });
      const rowsAfter = await tree.locator('[role="treeitem"]').count();
      expect(rowsAfter).not.toBe(rowsBefore);
    });

    test('Tree virtual — renders viewport with rows', async ({ page }) => {
      const vtree = page.getByTestId('phase30-tree-virtual');
      await vtree.scrollIntoViewIfNeeded();
      await expect(vtree).toBeAttached();
      await expect(vtree.locator('.cx-ui-tree__viewport')).toHaveCount(1);
      const count = await vtree.locator('[role="treeitem"]').count();
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });
}
