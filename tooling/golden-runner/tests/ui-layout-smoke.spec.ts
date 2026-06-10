import { expect, test, type Page } from '@playwright/test';

import {
  CHRONIX_UI_REACT_DEMO_URL,
  CHRONIX_UI_VUE2_DEMO_URL,
  CHRONIX_UI_VUE3_DEMO_URL,
} from '../src/config.js';

/**
 * chronix-ui Space + Flex + Grid behavioral smoke — Phase 17
 * (2026-06-02). TARGETS-loop pattern covering all 3 adapters.
 *
 * Key assertions:
 * - Space: modifier classes; inline-style `gap` matches `resolveSpaceGap`.
 * - Flex: modifier classes for direction/wrap; inline-style `gap`
 *   for token vs numeric.
 * - Grid: inline-style `grid-template-columns` reflects `resolveGridTracks`
 *   (numeric → repeat(N, minmax(0, 1fr)); string verbatim); inline-style
 *   `column-gap` / `row-gap` match `xGap` / `yGap`.
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
  test.describe(`chronix-ui ${name} / Phase 17 Layout smoke`, () => {
    test.beforeEach(async ({ page }) => {
      await visitDemo(page, url);
    });

    // ------------------------------------------------------------------
    // Space
    // ------------------------------------------------------------------

    test('default Space has --wrap modifier and medium-token gap inline style', async ({
      page,
    }) => {
      const space = page.getByTestId('space-default');
      await expect(space).toHaveClass(/cx-ui-space--wrap/);
      const gap = await space.evaluate((el: HTMLElement) => el.style.gap);
      expect(gap).toContain('--cx-ui-space-gap-medium');
    });

    test('vertical Space adds --vertical modifier', async ({ page }) => {
      await expect(page.getByTestId('space-vertical')).toHaveClass(/cx-ui-space--vertical/);
    });

    test('size="large" Space uses the large-token gap', async ({ page }) => {
      const gap = await page.getByTestId('space-large').evaluate((el: HTMLElement) => el.style.gap);
      expect(gap).toContain('--cx-ui-space-gap-large');
    });

    test('numeric size Space emits inline-style "gap: Npx"', async ({ page }) => {
      const gap = await page
        .getByTestId('space-numeric')
        .evaluate((el: HTMLElement) => el.style.gap);
      expect(gap).toBe('20px');
    });

    test('justify-between Space carries --justify-space-between modifier', async ({ page }) => {
      await expect(page.getByTestId('space-justify-between')).toHaveClass(
        /cx-ui-space--justify-space-between/,
      );
    });

    // ------------------------------------------------------------------
    // Flex
    // ------------------------------------------------------------------

    test('default Flex carries direction-row + wrap-nowrap modifiers + no inline gap', async ({
      page,
    }) => {
      const flex = page.getByTestId('flex-default');
      await expect(flex).toHaveClass(/cx-ui-flex--direction-row/);
      await expect(flex).toHaveClass(/cx-ui-flex--wrap-nowrap/);
      const gap = await flex.evaluate((el: HTMLElement) => el.style.gap);
      expect(gap).toBe('');
    });

    test('Flex direction=column adds the matching modifier', async ({ page }) => {
      await expect(page.getByTestId('flex-column')).toHaveClass(/cx-ui-flex--direction-column/);
    });

    test('Flex wrap=wrap-reverse adds the matching modifier', async ({ page }) => {
      await expect(page.getByTestId('flex-wrap-reverse')).toHaveClass(
        /cx-ui-flex--wrap-wrap-reverse/,
      );
    });

    test('Flex gap token applies CSS-var inline style', async ({ page }) => {
      const gap = await page
        .getByTestId('flex-gap-token')
        .evaluate((el: HTMLElement) => el.style.gap);
      expect(gap).toContain('--cx-ui-space-gap-medium');
    });

    test('Flex numeric gap applies "Npx" inline style', async ({ page }) => {
      const gap = await page
        .getByTestId('flex-gap-numeric')
        .evaluate((el: HTMLElement) => el.style.gap);
      expect(gap).toBe('16px');
    });

    test('Flex align=center + justify=center modifiers apply together', async ({ page }) => {
      const center = page.getByTestId('flex-center');
      await expect(center).toHaveClass(/cx-ui-flex--align-center/);
      await expect(center).toHaveClass(/cx-ui-flex--justify-center/);
    });

    // ------------------------------------------------------------------
    // Grid
    // ------------------------------------------------------------------

    test('numeric cols Grid renders grid-template-columns: repeat(N, minmax(0, 1fr))', async ({
      page,
    }) => {
      const grid = page.getByTestId('grid-3col');
      const tracks = await grid.evaluate((el: HTMLElement) => el.style.gridTemplateColumns);
      // Browser normalizes bare `0` inside minmax() to `0px`; accept either form.
      expect(tracks).toMatch(/^repeat\(3,\s*minmax\(0(?:px)?,\s*1fr\)\)$/);
    });

    test('12-col Grid emits 12-track template + 4px gaps', async ({ page }) => {
      const styles = await page.getByTestId('grid-12col').evaluate((el: HTMLElement) => ({
        tracks: el.style.gridTemplateColumns,
        colGap: el.style.columnGap,
        rowGap: el.style.rowGap,
      }));
      expect(styles.tracks).toMatch(/^repeat\(12,\s*minmax\(0(?:px)?,\s*1fr\)\)$/);
      expect(styles.colGap).toBe('4px');
      expect(styles.rowGap).toBe('4px');
    });

    test('string cols Grid passes track template verbatim + xGap inline', async ({ page }) => {
      const styles = await page.getByTestId('grid-custom').evaluate((el: HTMLElement) => ({
        tracks: el.style.gridTemplateColumns,
        colGap: el.style.columnGap,
      }));
      expect(styles.tracks).toBe('120px 1fr 120px');
      expect(styles.colGap).toBe('12px');
    });

    test('inline Grid carries --inline modifier', async ({ page }) => {
      await expect(page.getByTestId('grid-inline')).toHaveClass(/cx-ui-grid--inline/);
    });

    // ------------------------------------------------------------------
    // Style injection — each component injects exactly one <style>
    // ------------------------------------------------------------------

    test('Space + Flex + Grid stylesheets injected exactly once each', async ({ page }) => {
      expect(await page.locator('style[data-chronix-ui="space"]').count()).toBe(1);
      expect(await page.locator('style[data-chronix-ui="flex"]').count()).toBe(1);
      expect(await page.locator('style[data-chronix-ui="grid"]').count()).toBe(1);
    });
  });
}
