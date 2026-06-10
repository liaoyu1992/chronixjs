import { expect, test, type Page } from '@playwright/test';

import {
  CHRONIX_UI_REACT_DEMO_URL,
  CHRONIX_UI_VUE2_DEMO_URL,
  CHRONIX_UI_VUE3_DEMO_URL,
} from '../src/config.js';

/**
 * chronix-ui Ellipsis + Thing + Log behavioral smoke — Phase 23
 * (2026-06-03). TARGETS-loop pattern over 3 adapters.
 *
 * Phase 23 friction notes verified here:
 *
 * - 23-fr2 — Ellipsis root element is `<span>` (NOT `<div>`).
 * - 23-fr3 — Log line numbers are real DOM text inside
 *   `<span class="__line-number" aria-hidden="true">` (D.1).
 * - 23-fr4 — native HTML `title` attr present/absent based on
 *   `tooltip` prop value.
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
  test.describe(`chronix-ui ${name} / Phase 23 Ellipsis+Thing+Log smoke`, () => {
    test.beforeEach(async ({ page }) => {
      await visitDemo(page, url);
    });

    // ------------------------------------------------------------------
    // Ellipsis
    // ------------------------------------------------------------------

    test('Ellipsis single — root tag is SPAN with --lines-1 and --with-tooltip', async ({
      page,
    }) => {
      const root = page.getByTestId('ellipsis-single');
      const tag = await root.evaluate((el) => el.tagName);
      expect(tag).toBe('SPAN');
      await expect(root).toHaveClass(/cx-ui-ellipsis--lines-1/);
      await expect(root).toHaveClass(/cx-ui-ellipsis--with-tooltip/);
    });

    test('Ellipsis single — title attribute equals the full content', async ({ page }) => {
      const root = page.getByTestId('ellipsis-single');
      const title = await root.getAttribute('title');
      expect(title).toBeTruthy();
      const text = await root.textContent();
      expect(title).toBe(text);
    });

    test('Ellipsis multi-line — carries --lines-2 modifier (no --lines-1)', async ({ page }) => {
      const root = page.getByTestId('ellipsis-multi-line');
      await expect(root).toHaveClass(/cx-ui-ellipsis--lines-2/);
      await expect(root).not.toHaveClass(/cx-ui-ellipsis--lines-1\b/);
    });

    test('Ellipsis no-tooltip — has no title attribute and no --with-tooltip modifier', async ({
      page,
    }) => {
      const root = page.getByTestId('ellipsis-no-tooltip');
      const title = await root.getAttribute('title');
      expect(title).toBeNull();
      await expect(root).not.toHaveClass(/cx-ui-ellipsis--with-tooltip/);
    });

    // ------------------------------------------------------------------
    // Thing
    // ------------------------------------------------------------------

    test('Thing basic — root DIV + --with-header + --with-description + --with-content', async ({
      page,
    }) => {
      const root = page.getByTestId('thing-basic');
      const tag = await root.evaluate((el) => el.tagName);
      expect(tag).toBe('DIV');
      await expect(root).toHaveClass(/cx-ui-thing--with-header/);
      await expect(root).toHaveClass(/cx-ui-thing--with-description/);
      await expect(root).toHaveClass(/cx-ui-thing--with-content/);
      await expect(root).not.toHaveClass(/cx-ui-thing--with-avatar/);
    });

    test('Thing with-avatar — --with-avatar modifier + __avatar element rendered', async ({
      page,
    }) => {
      const root = page.getByTestId('thing-with-avatar');
      await expect(root).toHaveClass(/cx-ui-thing--with-avatar/);
      await expect(root.locator('.cx-ui-thing__avatar')).toHaveCount(1);
    });

    test('Thing full — every --with-* modifier + all sub-elements rendered', async ({ page }) => {
      const root = page.getByTestId('thing-full');
      await expect(root).toHaveClass(/cx-ui-thing--with-avatar/);
      await expect(root).toHaveClass(/cx-ui-thing--with-header/);
      await expect(root).toHaveClass(/cx-ui-thing--with-header-extra/);
      await expect(root).toHaveClass(/cx-ui-thing--with-description/);
      await expect(root).toHaveClass(/cx-ui-thing--with-content/);
      await expect(root).toHaveClass(/cx-ui-thing--with-action/);
      await expect(root).toHaveClass(/cx-ui-thing--with-footer/);
      await expect(root.locator('.cx-ui-thing__avatar')).toHaveCount(1);
      await expect(root.locator('.cx-ui-thing__header-content')).toHaveCount(1);
      await expect(root.locator('.cx-ui-thing__header-extra')).toHaveCount(1);
      await expect(root.locator('.cx-ui-thing__description')).toHaveCount(1);
      await expect(root.locator('.cx-ui-thing__content')).toHaveCount(1);
      await expect(root.locator('.cx-ui-thing__action')).toHaveCount(1);
      await expect(root.locator('.cx-ui-thing__footer')).toHaveCount(1);
    });

    test('Thing indented — carries --content-indented modifier', async ({ page }) => {
      const root = page.getByTestId('thing-indented');
      await expect(root).toHaveClass(/cx-ui-thing--content-indented/);
    });

    // ------------------------------------------------------------------
    // Log
    // ------------------------------------------------------------------

    test('Log basic — root DIV + lines container is OL + correct __line count', async ({
      page,
    }) => {
      const root = page.getByTestId('log-basic');
      const tag = await root.evaluate((el) => el.tagName);
      expect(tag).toBe('DIV');
      const linesContainer = root.locator('.cx-ui-log__lines');
      await expect(linesContainer).toHaveCount(1);
      const linesTag = await linesContainer.evaluate((el) => el.tagName);
      expect(linesTag).toBe('OL');
      await expect(root.locator('.cx-ui-log__line')).toHaveCount(5);
    });

    test('Log basic — no __line-number elements when lineNumbers is unset', async ({ page }) => {
      const root = page.getByTestId('log-basic');
      await expect(root.locator('.cx-ui-log__line-number')).toHaveCount(0);
      await expect(root).not.toHaveClass(/cx-ui-log--with-line-numbers/);
    });

    test('Log with-line-numbers — modifier + 5 __line-number spans with text "1".."5"', async ({
      page,
    }) => {
      const root = page.getByTestId('log-with-line-numbers');
      await expect(root).toHaveClass(/cx-ui-log--with-line-numbers/);
      const numbers = root.locator('.cx-ui-log__line-number');
      await expect(numbers).toHaveCount(5);
      const texts = await numbers.evaluateAll((els) =>
        els.map((el) => (el.textContent ?? '').trim()),
      );
      expect(texts).toEqual(['1', '2', '3', '4', '5']);
    });

    test('Log loading — --loading modifier + __loading text "loading..."', async ({ page }) => {
      const root = page.getByTestId('log-loading');
      await expect(root).toHaveClass(/cx-ui-log--loading/);
      const loading = root.locator('.cx-ui-log__loading');
      await expect(loading).toHaveCount(1);
      await expect(loading).toHaveText('loading...');
    });

    test('Log max-height — inline style.maxHeight=200px + overflow=auto', async ({ page }) => {
      const root = page.getByTestId('log-max-height');
      const inlineStyle = await root.getAttribute('style');
      expect(inlineStyle).not.toBeNull();
      // Accept either CSS property name format; both should serialize as px.
      expect(inlineStyle!).toMatch(/max-height:\s*200px/);
      expect(inlineStyle!).toMatch(/overflow:\s*auto/);
    });

    // ------------------------------------------------------------------
    // Style injection — each component injects exactly one <style>
    // ------------------------------------------------------------------

    test('Ellipsis + Thing + Log stylesheets injected exactly once each', async ({ page }) => {
      expect(await page.locator('style[data-chronix-ui="ellipsis"]').count()).toBe(1);
      expect(await page.locator('style[data-chronix-ui="thing"]').count()).toBe(1);
      expect(await page.locator('style[data-chronix-ui="log"]').count()).toBe(1);
    });
  });
}
