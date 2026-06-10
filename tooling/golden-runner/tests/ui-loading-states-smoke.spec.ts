import { expect, test, type Page } from '@playwright/test';

import {
  CHRONIX_UI_REACT_DEMO_URL,
  CHRONIX_UI_VUE2_DEMO_URL,
  CHRONIX_UI_VUE3_DEMO_URL,
} from '../src/config.js';

/**
 * chronix-ui Spin + Progress + Skeleton behavioral smoke — Phase 16
 * (2026-06-02). One spec covering all 3 adapters via TARGETS loop.
 *
 * Key assertions:
 * - Spin: --with-description / --hidden modifiers; __indicator role.
 * - Progress: __fill inline-style width matches percentage; __info
 *   text format; --type-* modifier; info-inside placement renders
 *   inside __rail; height inline style.
 * - Skeleton: shape modifier; --animated / --round; inline width/height
 *   reflects formatSkeletonSize (numeric → Npx; string → verbatim).
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
  test.describe(`chronix-ui ${name} / Phase 16 Loading-states smoke`, () => {
    test.beforeEach(async ({ page }) => {
      await visitDemo(page, url);
    });

    // ------------------------------------------------------------------
    // Spin
    // ------------------------------------------------------------------

    test('default Spin renders __indicator with role=status and no description', async ({
      page,
    }) => {
      const spin = page.getByTestId('spin-default');
      await expect(spin).toBeVisible();
      const indicator = spin.locator('.cx-ui-spin__indicator');
      await expect(indicator).toBeVisible();
      await expect(indicator).toHaveAttribute('role', 'status');
      await expect(spin.locator('.cx-ui-spin__description')).toHaveCount(0);
      await expect(spin).not.toHaveClass(/cx-ui-spin--with-description/);
    });

    test('Spin with description renders __description + --with-description modifier', async ({
      page,
    }) => {
      const spin = page.getByTestId('spin-with-desc');
      await expect(spin).toHaveClass(/cx-ui-spin--with-description/);
      await expect(spin.locator('.cx-ui-spin__description')).toHaveText('Loading data');
    });

    test('Spin sizes apply matching --size modifier', async ({ page }) => {
      await expect(page.getByTestId('spin-small')).toHaveClass(/cx-ui-spin--small/);
      await expect(page.getByTestId('spin-default')).toHaveClass(/cx-ui-spin--medium/);
      await expect(page.getByTestId('spin-large')).toHaveClass(/cx-ui-spin--large/);
    });

    test('hidden Spin keeps __indicator in DOM but adds --hidden modifier', async ({ page }) => {
      const hidden = page.getByTestId('spin-hidden');
      await expect(hidden).toHaveClass(/cx-ui-spin--hidden/);
      await expect(hidden.locator('.cx-ui-spin__indicator')).toHaveCount(1);
    });

    // ------------------------------------------------------------------
    // Progress
    // ------------------------------------------------------------------

    test('Progress __fill inline-style width matches the percentage prop', async ({ page }) => {
      // progress-default = 42%, progress-success = 80%, progress-error = 12%
      for (const [testid, expectedWidth] of [
        ['progress-default', '42%'],
        ['progress-success', '80%'],
        ['progress-error', '12%'],
        ['progress-tall', '88%'],
      ] as const) {
        const progress = page.getByTestId(testid);
        const fill = progress.locator('.cx-ui-progress__fill');
        const widthStyle = await fill.evaluate((el: HTMLElement) => el.style.width);
        expect(widthStyle, `fill width for ${testid}`).toBe(expectedWidth);
      }
    });

    test('Progress __info text matches the rounded percentage', async ({ page }) => {
      await expect(
        page.getByTestId('progress-default').locator('.cx-ui-progress__info'),
      ).toHaveText('42%');
      await expect(page.getByTestId('progress-info').locator('.cx-ui-progress__info')).toHaveText(
        '33%',
      );
    });

    test('Progress type modifiers apply', async ({ page }) => {
      await expect(page.getByTestId('progress-success')).toHaveClass(/cx-ui-progress--success/);
      await expect(page.getByTestId('progress-warning')).toHaveClass(/cx-ui-progress--warning/);
      await expect(page.getByTestId('progress-error')).toHaveClass(/cx-ui-progress--error/);
      await expect(page.getByTestId('progress-info')).toHaveClass(/cx-ui-progress--info/);
    });

    test('Progress with showInfo=false omits __info entirely', async ({ page }) => {
      const noInfo = page.getByTestId('progress-no-info');
      await expect(noInfo).not.toHaveClass(/cx-ui-progress--with-info/);
      await expect(noInfo.locator('.cx-ui-progress__info')).toHaveCount(0);
    });

    test('Progress with indicatorPlacement=inside renders __info inside __rail', async ({
      page,
    }) => {
      const inside = page.getByTestId('progress-inside');
      await expect(inside).toHaveClass(/cx-ui-progress--info-inside/);
      await expect(inside.locator('.cx-ui-progress__rail .cx-ui-progress__info')).toHaveText('60%');
    });

    test('Progress height prop sets inline __rail height', async ({ page }) => {
      const tall = page.getByTestId('progress-tall');
      const railHeight = await tall
        .locator('.cx-ui-progress__rail')
        .evaluate((el: HTMLElement) => el.style.height);
      expect(railHeight).toBe('14px');
    });

    // ------------------------------------------------------------------
    // Skeleton
    // ------------------------------------------------------------------

    test('Skeleton shape modifiers apply', async ({ page }) => {
      await expect(page.getByTestId('skeleton-text')).toHaveClass(/cx-ui-skeleton--text/);
      await expect(page.getByTestId('skeleton-rect')).toHaveClass(/cx-ui-skeleton--rect/);
      await expect(page.getByTestId('skeleton-circle')).toHaveClass(/cx-ui-skeleton--circle/);
    });

    test('Skeleton numeric width/height becomes Npx inline style', async ({ page }) => {
      const rect = page.getByTestId('skeleton-rect');
      const styles = await rect.evaluate((el: HTMLElement) => ({
        width: el.style.width,
        height: el.style.height,
      }));
      expect(styles.width).toBe('200px');
      expect(styles.height).toBe('60px');
    });

    test('Skeleton round + numeric size modifiers + width/height', async ({ page }) => {
      const round = page.getByTestId('skeleton-round');
      await expect(round).toHaveClass(/cx-ui-skeleton--round/);
      const styles = await round.evaluate((el: HTMLElement) => ({
        width: el.style.width,
        height: el.style.height,
      }));
      expect(styles.width).toBe('120px');
      expect(styles.height).toBe('12px');
    });

    test('Skeleton animated=false omits --animated modifier', async ({ page }) => {
      const stat = page.getByTestId('skeleton-static');
      await expect(stat).not.toHaveClass(/cx-ui-skeleton--animated/);
    });

    // ------------------------------------------------------------------
    // Style injection — each component injects exactly one <style>
    // ------------------------------------------------------------------

    test('Spin + Progress + Skeleton stylesheets injected exactly once each', async ({ page }) => {
      expect(await page.locator('style[data-chronix-ui="spin"]').count()).toBe(1);
      expect(await page.locator('style[data-chronix-ui="progress"]').count()).toBe(1);
      expect(await page.locator('style[data-chronix-ui="skeleton"]').count()).toBe(1);
    });
  });
}
