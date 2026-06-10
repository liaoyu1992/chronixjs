import { expect, test, type Page } from '@playwright/test';

import {
  CHRONIX_UI_REACT_DEMO_URL,
  CHRONIX_UI_VUE2_DEMO_URL,
  CHRONIX_UI_VUE3_DEMO_URL,
} from '../src/config.js';

/**
 * chronix-ui Phase 29 Tier B remainder behavioral smoke — 2026-06-04.
 * TARGETS-loop over 3 adapters. Demos pre-populate controlled state.
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
  test.describe(`chronix-ui ${name} / Phase 29 Tier B remainder smoke`, () => {
    test.beforeEach(async ({ page }) => {
      await visitDemo(page, url);
    });

    test('Carousel — viewport + 3 slides + 3 dots + 2 arrows + active slide', async ({ page }) => {
      const carousel = page.getByTestId('phase29-carousel');
      await expect(carousel).toHaveClass(/cx-ui-carousel--direction-horizontal/);
      await expect(carousel.locator('.cx-ui-carousel__viewport')).toHaveCount(1);
      await expect(carousel.locator('.cx-ui-carousel__slide')).toHaveCount(3);
      await expect(carousel.locator('.cx-ui-carousel__slide--active')).toHaveCount(1);
      await expect(carousel.locator('.cx-ui-carousel__dot')).toHaveCount(3);
      await expect(carousel.locator('.cx-ui-carousel__dot--active')).toHaveCount(1);
      await expect(carousel.locator('.cx-ui-carousel__arrow')).toHaveCount(2);
    });

    test('Wave — wrapper span with base class only (no rippling at page load)', async ({
      page,
    }) => {
      const wave = page.getByTestId('phase29-wave');
      expect(await wave.evaluate((el) => el.tagName)).toBe('SPAN');
      await expect(wave).toHaveClass(/cx-ui-wave/);
      const classAttr = (await wave.getAttribute('class')) ?? '';
      expect(classAttr.includes('cx-ui-wave--rippling')).toBe(false);
    });

    test('FocusDetector — wrapper span with base class wrapping the input', async ({ page }) => {
      const fd = page.getByTestId('phase29-focus-detector');
      expect(await fd.evaluate((el) => el.tagName)).toBe('SPAN');
      await expect(fd).toHaveClass(/cx-ui-focus-detector/);
      await expect(fd.locator('input')).toHaveCount(1);
    });
  });
}
