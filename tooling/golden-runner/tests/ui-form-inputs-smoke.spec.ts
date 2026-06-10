import { expect, test, type Page } from '@playwright/test';

import {
  CHRONIX_UI_REACT_DEMO_URL,
  CHRONIX_UI_VUE2_DEMO_URL,
  CHRONIX_UI_VUE3_DEMO_URL,
} from '../src/config.js';

/**
 * chronix-ui Phase 25 Tier B form-inputs behavioral smoke — 2026-06-03.
 * TARGETS-loop over 3 adapters. One smoke spec covers all 8 components
 * per the compressed cookbook.
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
  test.describe(`chronix-ui ${name} / Phase 25 Tier B form-inputs smoke`, () => {
    test.beforeEach(async ({ page }) => {
      await visitDemo(page, url);
    });

    test('Input — <div> root + <input.cx-ui-input__inner> + --medium', async ({ page }) => {
      const root = page.getByTestId('phase25-input');
      expect(await root.evaluate((el) => el.tagName)).toBe('DIV');
      await expect(root).toHaveClass(/cx-ui-input--medium/);
      await expect(root.locator('input.cx-ui-input__inner')).toHaveCount(1);
    });

    test('Input textarea variant — <textarea.cx-ui-input__inner> + --textarea', async ({
      page,
    }) => {
      const root = page.getByTestId('phase25-input-textarea');
      await expect(root).toHaveClass(/cx-ui-input--textarea/);
      await expect(root.locator('textarea.cx-ui-input__inner')).toHaveCount(1);
    });

    test('Input clearable — clear button renders when value non-empty', async ({ page }) => {
      const root = page.getByTestId('phase25-input-clearable');
      await expect(root).toHaveClass(/cx-ui-input--clearable/);
      await expect(root.locator('button.cx-ui-input__clear')).toHaveCount(1);
    });

    test('InputOtp — 6 cells', async ({ page }) => {
      const root = page.getByTestId('phase25-input-otp');
      expect(await root.evaluate((el) => el.tagName)).toBe('DIV');
      await expect(root.locator('input.cx-ui-otp__cell')).toHaveCount(6);
    });

    test('Checkbox — <label> + --checked + svg icon', async ({ page }) => {
      const root = page.getByTestId('phase25-checkbox');
      expect(await root.evaluate((el) => el.tagName)).toBe('LABEL');
      await expect(root).toHaveClass(/cx-ui-checkbox--checked/);
      await expect(root.locator('svg.cx-ui-checkbox__icon')).toHaveCount(1);
    });

    test('Checkbox indeterminate — --indeterminate + span icon (no svg)', async ({ page }) => {
      const root = page.getByTestId('phase25-checkbox-indeterminate');
      await expect(root).toHaveClass(/cx-ui-checkbox--indeterminate/);
      await expect(root.locator('span.cx-ui-checkbox__icon')).toHaveCount(1);
      await expect(root.locator('svg.cx-ui-checkbox__icon')).toHaveCount(0);
    });

    test('Switch — <button role="switch" aria-checked="true">', async ({ page }) => {
      const root = page.getByTestId('phase25-switch');
      expect(await root.evaluate((el) => el.tagName)).toBe('BUTTON');
      expect(await root.getAttribute('role')).toBe('switch');
      expect(await root.getAttribute('aria-checked')).toBe('true');
      expect(await root.getAttribute('type')).toBe('button');
    });

    test('RadioGroup — 3 radio labels + first --checked', async ({ page }) => {
      const root = page.getByTestId('phase25-radio-group');
      expect(await root.evaluate((el) => el.tagName)).toBe('DIV');
      expect(await root.getAttribute('role')).toBe('radiogroup');
      await expect(root.locator('label.cx-ui-radio')).toHaveCount(3);
      await expect(root.locator('label.cx-ui-radio').first()).toHaveClass(/cx-ui-radio--checked/);
    });

    test('Rate — 5 stars + first 3 --full', async ({ page }) => {
      const root = page.getByTestId('phase25-rate');
      const stars = root.locator('button.cx-ui-rate__star');
      await expect(stars).toHaveCount(5);
      for (let i = 0; i < 3; i++) {
        await expect(stars.nth(i)).toHaveClass(/cx-ui-rate__star--full/);
      }
      await expect(stars.nth(3)).toHaveClass(/cx-ui-rate__star--empty/);
    });

    test('Rate half — 3rd star is --half when value=2.5 + allowHalf', async ({ page }) => {
      const root = page.getByTestId('phase25-rate-half');
      await expect(root.locator('button.cx-ui-rate__star').nth(2)).toHaveClass(
        /cx-ui-rate__star--half/,
      );
    });

    test('InputNumber — stepper buttons + input + type=button', async ({ page }) => {
      const root = page.getByTestId('phase25-input-number');
      expect(await root.evaluate((el) => el.tagName)).toBe('DIV');
      await expect(root.locator('.cx-ui-input-number__decrement')).toHaveCount(1);
      await expect(root.locator('.cx-ui-input-number__increment')).toHaveCount(1);
      await expect(root.locator('input.cx-ui-input-number__input')).toHaveCount(1);
      expect(
        await root.locator('.cx-ui-input-number__increment').first().getAttribute('type'),
      ).toBe('button');
    });

    test('AutoComplete — <div> root + closed list initially', async ({ page }) => {
      const root = page.getByTestId('phase25-autocomplete');
      expect(await root.evaluate((el) => el.tagName)).toBe('DIV');
      await expect(root.locator('input.cx-ui-autocomplete__input')).toHaveCount(1);
      // List is hidden by default (no focus + no input yet)
      await expect(root.locator('ul.cx-ui-autocomplete__list')).toHaveCount(0);
    });
  });
}
