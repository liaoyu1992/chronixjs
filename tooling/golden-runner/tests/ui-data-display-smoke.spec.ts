import { expect, test, type Page } from '@playwright/test';

import {
  CHRONIX_UI_REACT_DEMO_URL,
  CHRONIX_UI_VUE2_DEMO_URL,
  CHRONIX_UI_VUE3_DEMO_URL,
} from '../src/config.js';

/**
 * chronix-ui Descriptions + List behavioral smoke — Phase 21
 * (2026-06-03). TARGETS-loop pattern over 3 adapters.
 *
 * Phase 17 17-fr1 + Phase 21 grid-column friction notes:
 *
 * - `grid-template-columns: repeat(3, minmax(0, 1fr))` browser-
 *   serializes back as `repeat(3, minmax(0px, 1fr))`. Assertions
 *   use regex to accept both forms.
 * - `grid-column: span 2` browser-serializes back as
 *   `auto / span 2` on read-back. Assertions use regex
 *   `/span\s+N/`.
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
  test.describe(`chronix-ui ${name} / Phase 21 Descriptions+List smoke`, () => {
    test.beforeEach(async ({ page }) => {
      await visitDemo(page, url);
    });

    // ------------------------------------------------------------------
    // Descriptions
    // ------------------------------------------------------------------

    test('Descriptions default — root tag is DIV; item count matches items.length', async ({
      page,
    }) => {
      const root = page.getByTestId('descriptions-default');
      await expect(root.locator('xpath=.')).toHaveAttribute('class', /cx-ui-descriptions/);
      const tag = await root.evaluate((el) => el.tagName);
      expect(tag).toBe('DIV');
      await expect(root.locator('.cx-ui-descriptions__item')).toHaveCount(3);
    });

    test('Descriptions default — __grid carries inline grid-template-columns matching repeat(3, …)', async ({
      page,
    }) => {
      const grid = page.getByTestId('descriptions-default').locator('.cx-ui-descriptions__grid');
      const value = await grid.evaluate((el) => (el as HTMLElement).style.gridTemplateColumns);
      expect(value).toMatch(/^repeat\(3,\s*minmax\(0(?:px)?,\s*1fr\)\)$/);
    });

    test('Descriptions with-span — the spanning item has style.gridColumn matching /span\\s+2/', async ({
      page,
    }) => {
      const items = page.getByTestId('descriptions-with-span').locator('.cx-ui-descriptions__item');
      // 4th item carries span: 2
      const spanItemStyle = await items
        .nth(3)
        .evaluate((el) => (el as HTMLElement).style.gridColumn);
      expect(spanItemStyle).toMatch(/span\s+2/);
    });

    test('Descriptions with-span — non-spanning items have no gridColumn inline style', async ({
      page,
    }) => {
      const items = page.getByTestId('descriptions-with-span').locator('.cx-ui-descriptions__item');
      const firstStyle = await items.nth(0).evaluate((el) => (el as HTMLElement).style.gridColumn);
      expect(firstStyle).toBe('');
    });

    test('Descriptions with-title — renders __title text and adds --with-title modifier', async ({
      page,
    }) => {
      const root = page.getByTestId('descriptions-with-title');
      await expect(root).toHaveClass(/cx-ui-descriptions--with-title/);
      await expect(root.locator('.cx-ui-descriptions__title')).toHaveText('Profile');
    });

    test('Descriptions default — omits __title element and --with-title modifier', async ({
      page,
    }) => {
      const root = page.getByTestId('descriptions-default');
      await expect(root).not.toHaveClass(/cx-ui-descriptions--with-title/);
      await expect(root.locator('.cx-ui-descriptions__title')).toHaveCount(0);
    });

    test('Descriptions bordered carries --bordered modifier', async ({ page }) => {
      const root = page.getByTestId('descriptions-bordered');
      await expect(root).toHaveClass(/cx-ui-descriptions--bordered/);
    });

    test('Descriptions vertical carries --placement-top modifier', async ({ page }) => {
      const root = page.getByTestId('descriptions-vertical');
      await expect(root).toHaveClass(/cx-ui-descriptions--placement-top/);
    });

    test('Descriptions small carries --small size modifier', async ({ page }) => {
      const root = page.getByTestId('descriptions-small');
      await expect(root).toHaveClass(/cx-ui-descriptions--small/);
    });

    test('Descriptions default — __label and __value text match', async ({ page }) => {
      const root = page.getByTestId('descriptions-default');
      const labels = root.locator('.cx-ui-descriptions__label');
      const values = root.locator('.cx-ui-descriptions__value');
      await expect(labels.nth(0)).toHaveText('Name');
      await expect(values.nth(0)).toHaveText('Liao Yu');
    });

    // ------------------------------------------------------------------
    // List
    // ------------------------------------------------------------------

    test('List basic — root tag is UL', async ({ page }) => {
      const root = page.getByTestId('list-basic');
      const tag = await root.evaluate((el) => el.tagName);
      expect(tag).toBe('UL');
    });

    test('List basic — item count equals items.length', async ({ page }) => {
      const root = page.getByTestId('list-basic');
      await expect(root.locator('.cx-ui-list__item')).toHaveCount(3);
    });

    test('List basic — items are <li> elements with __title text', async ({ page }) => {
      const root = page.getByTestId('list-basic');
      const items = root.locator('.cx-ui-list__item');
      const firstTag = await items.nth(0).evaluate((el) => el.tagName);
      expect(firstTag).toBe('LI');
      await expect(items.nth(0).locator('.cx-ui-list__title')).toHaveText('Documents');
    });

    test('List bordered-hoverable carries both --bordered + --hoverable modifiers', async ({
      page,
    }) => {
      const root = page.getByTestId('list-bordered-hoverable');
      await expect(root).toHaveClass(/cx-ui-list--bordered/);
      await expect(root).toHaveClass(/cx-ui-list--hoverable/);
    });

    test('List no-divider omits --with-divider modifier', async ({ page }) => {
      const root = page.getByTestId('list-no-divider');
      await expect(root).not.toHaveClass(/cx-ui-list--with-divider/);
    });

    test('List with-prefix-suffix — first item has __prefix + __suffix + __description elements', async ({
      page,
    }) => {
      const item = page.getByTestId('list-with-prefix-suffix').locator('.cx-ui-list__item').nth(0);
      await expect(item).toHaveClass(/cx-ui-list__item--with-prefix/);
      await expect(item).toHaveClass(/cx-ui-list__item--with-suffix/);
      await expect(item).toHaveClass(/cx-ui-list__item--with-description/);
      await expect(item.locator('.cx-ui-list__prefix')).toHaveText('📁');
      await expect(item.locator('.cx-ui-list__suffix')).toHaveText('→');
      await expect(item.locator('.cx-ui-list__description')).toHaveText(
        '14 items · last edited yesterday',
      );
    });

    test('List with-prefix-suffix — third item omits __suffix element and --with-suffix modifier', async ({
      page,
    }) => {
      const item = page.getByTestId('list-with-prefix-suffix').locator('.cx-ui-list__item').nth(2);
      await expect(item).toHaveClass(/cx-ui-list__item--with-prefix/);
      await expect(item).not.toHaveClass(/cx-ui-list__item--with-suffix/);
      await expect(item.locator('.cx-ui-list__suffix')).toHaveCount(0);
    });

    test('List basic — items omit prefix / suffix / description elements + modifiers', async ({
      page,
    }) => {
      const item = page.getByTestId('list-basic').locator('.cx-ui-list__item').nth(0);
      await expect(item).not.toHaveClass(/cx-ui-list__item--with-prefix/);
      await expect(item).not.toHaveClass(/cx-ui-list__item--with-suffix/);
      await expect(item).not.toHaveClass(/cx-ui-list__item--with-description/);
      await expect(item.locator('.cx-ui-list__prefix')).toHaveCount(0);
      await expect(item.locator('.cx-ui-list__suffix')).toHaveCount(0);
      await expect(item.locator('.cx-ui-list__description')).toHaveCount(0);
    });

    test('List small carries --small size modifier', async ({ page }) => {
      const root = page.getByTestId('list-small');
      await expect(root).toHaveClass(/cx-ui-list--small/);
    });

    // ------------------------------------------------------------------
    // Style injection — each component injects exactly one <style>
    // ------------------------------------------------------------------

    test('Descriptions + List stylesheets injected exactly once each', async ({ page }) => {
      expect(await page.locator('style[data-chronix-ui="descriptions"]').count()).toBe(1);
      expect(await page.locator('style[data-chronix-ui="list"]').count()).toBe(1);
    });
  });
}
