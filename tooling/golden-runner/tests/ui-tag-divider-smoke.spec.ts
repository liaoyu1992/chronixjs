import { expect, test, type Page } from '@playwright/test';

import {
  CHRONIX_UI_REACT_DEMO_URL,
  CHRONIX_UI_VUE2_DEMO_URL,
  CHRONIX_UI_VUE3_DEMO_URL,
} from '../src/config.js';

/**
 * chronix-ui Tag + Divider behavioral smoke — Phase 13 (2026-06-02).
 *
 * Single spec covering all 3 adapters (vue3 / vue2 / react). The
 * per-component parity spec (`ui-tag-divider-parity.spec.ts`)
 * already proves cross-adapter DOM fingerprints match, so the
 * behavioral assertions need only run once per demo. Consolidating
 * here keeps the assertion text in one place; structural divergence
 * would surface in the parity spec, behavioral divergence here.
 *
 * Drives Phase 13's Tag + Divider sections in all 3 demos. Requires
 * dev servers running (8731 / 8732 / 8733) before invocation.
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
  test.describe(`chronix-ui ${name} / Phase 13 Tag + Divider smoke`, () => {
    test.beforeEach(async ({ page }) => {
      await visitDemo(page, url);
    });

    test('all 6 Tag types render with the matching --type modifier', async ({ page }) => {
      for (const t of ['default', 'primary', 'info', 'success', 'warning', 'error'] as const) {
        const tag = page.getByTestId(`tag-${t}`);
        await expect(tag).toBeVisible();
        await expect(tag).toHaveClass(new RegExp(`cx-ui-tag--${t}`));
      }
    });

    test('all 3 Tag sizes render with the matching --size modifier', async ({ page }) => {
      for (const s of ['small', 'medium', 'large'] as const) {
        await expect(page.getByTestId(`tag-${s}`)).toHaveClass(new RegExp(`cx-ui-tag--${s}`));
      }
    });

    test('round + closable + disabled Tag modifiers render', async ({ page }) => {
      await expect(page.getByTestId('tag-round')).toHaveClass(/cx-ui-tag--round/);
      await expect(page.getByTestId('tag-closable')).toHaveClass(/cx-ui-tag--closable/);
      await expect(page.getByTestId('tag-disabled')).toHaveClass(/cx-ui-tag--disabled/);
    });

    test('clicking the closable Tag close button increments its counter', async ({ page }) => {
      const counter = page.getByTestId('counter-tag-close');
      await expect(counter).toHaveText('0');
      // The close button is the first __close descendant of the closable tag.
      const closable = page.getByTestId('tag-closable');
      await closable.locator('.cx-ui-tag__close').click();
      await expect(counter).toHaveText('1');
      await closable.locator('.cx-ui-tag__close').click();
      await expect(counter).toHaveText('2');
    });

    test('Divider variants render with the matching modifier classes', async ({ page }) => {
      await expect(page.getByTestId('divider-default')).toHaveClass(/cx-ui-divider--horizontal/);
      await expect(page.getByTestId('divider-default')).not.toHaveClass(
        /cx-ui-divider--with-title/,
      );

      await expect(page.getByTestId('divider-left')).toHaveClass(/cx-ui-divider--with-title/);
      await expect(page.getByTestId('divider-left')).toHaveClass(/cx-ui-divider--title-left/);

      await expect(page.getByTestId('divider-right')).toHaveClass(/cx-ui-divider--title-right/);

      await expect(page.getByTestId('divider-dashed')).toHaveClass(/cx-ui-divider--dashed/);

      await expect(page.getByTestId('divider-vertical')).toHaveClass(/cx-ui-divider--vertical/);
      await expect(page.getByTestId('divider-vertical')).not.toHaveClass(
        /cx-ui-divider--horizontal/,
      );
    });

    test('Divider with title renders the __title span containing slot text', async ({ page }) => {
      const left = page.getByTestId('divider-left');
      const title = left.locator('.cx-ui-divider__title');
      await expect(title).toBeVisible();
      await expect(title).toHaveText('Left-aligned');
    });

    test('vertical Divider renders no __title even with slot text', async ({ page }) => {
      const vert = page.getByTestId('divider-vertical');
      const title = vert.locator('.cx-ui-divider__title');
      await expect(title).toHaveCount(0);
    });

    test('Tag + Divider stylesheets injected exactly once each', async ({ page }) => {
      const tagStyles = await page.locator('style[data-chronix-ui="tag"]').count();
      const dividerStyles = await page.locator('style[data-chronix-ui="divider"]').count();
      expect(tagStyles).toBe(1);
      expect(dividerStyles).toBe(1);
    });
  });
}
