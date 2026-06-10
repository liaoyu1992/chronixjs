import { expect, test, type Page } from '@playwright/test';

import {
  CHRONIX_UI_REACT_DEMO_URL,
  CHRONIX_UI_VUE2_DEMO_URL,
  CHRONIX_UI_VUE3_DEMO_URL,
} from '../src/config.js';

/**
 * chronix-ui Result + Statistic + Countdown behavioral smoke —
 * Phase 18 (2026-06-02). TARGETS-loop pattern over 3 adapters.
 *
 * Countdown initial-render assertions use `active=false` testids
 * from the demo so the displayed value is deterministic (no
 * tick-driven race vs Playwright's polling).
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
  test.describe(`chronix-ui ${name} / Phase 18 Status+Numeric smoke`, () => {
    test.beforeEach(async ({ page }) => {
      await visitDemo(page, url);
    });

    // ------------------------------------------------------------------
    // Result
    // ------------------------------------------------------------------

    test('Result status modifier + icon + title + description', async ({ page }) => {
      const success = page.getByTestId('result-success');
      await expect(success).toHaveClass(/cx-ui-result--status-success/);
      await expect(success.locator('.cx-ui-result__icon')).toHaveText('✅');
      await expect(success.locator('.cx-ui-result__title')).toHaveText('Done');
      await expect(success.locator('.cx-ui-result__description')).toHaveText('Saved successfully.');
    });

    test('Result HTTP-status (404) carries its own modifier + icon', async ({ page }) => {
      const result = page.getByTestId('result-404');
      await expect(result).toHaveClass(/cx-ui-result--status-404/);
      await expect(result.locator('.cx-ui-result__icon')).toHaveText('🔍');
    });

    test('Result with extra slot renders __extra + --with-extra modifier', async ({ page }) => {
      const result = page.getByTestId('result-with-extra');
      await expect(result).toHaveClass(/cx-ui-result--with-extra/);
      await expect(result.locator('.cx-ui-result__extra button.cx-ui-button')).toHaveText(
        'Continue',
      );
    });

    test('Result __icon carries aria-hidden="true" for screen readers', async ({ page }) => {
      const icon = page.getByTestId('result-default').locator('.cx-ui-result__icon');
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    // ------------------------------------------------------------------
    // Statistic
    // ------------------------------------------------------------------

    test('Statistic renders __label + __value with the basic numeric', async ({ page }) => {
      const stat = page.getByTestId('stat-basic');
      await expect(stat).toHaveClass(/cx-ui-statistic--with-label/);
      await expect(stat).toHaveClass(/cx-ui-statistic--tabular-nums/);
      await expect(stat.locator('.cx-ui-statistic__label')).toHaveText('Users');
      await expect(stat.locator('.cx-ui-statistic__value')).toHaveText('1234');
    });

    test('Statistic precision applies toFixed(N) to numeric value', async ({ page }) => {
      const stat = page.getByTestId('stat-precision');
      // 0.4267 with precision 2 → "0.43"
      await expect(stat.locator('.cx-ui-statistic__value')).toHaveText('0.43');
    });

    test('Statistic prefix slot renders inside __prefix with the modifier class', async ({
      page,
    }) => {
      const stat = page.getByTestId('stat-prefix');
      await expect(stat).toHaveClass(/cx-ui-statistic--with-prefix/);
      await expect(stat.locator('.cx-ui-statistic__prefix')).toHaveText('$');
      await expect(stat.locator('.cx-ui-statistic__value')).toHaveText('1234.50');
    });

    test('Statistic suffix slot renders inside __suffix with the modifier class', async ({
      page,
    }) => {
      const stat = page.getByTestId('stat-suffix');
      await expect(stat).toHaveClass(/cx-ui-statistic--with-suffix/);
      await expect(stat.locator('.cx-ui-statistic__suffix')).toHaveText('GB');
    });

    test('Statistic undefined value renders "-" placeholder', async ({ page }) => {
      const stat = page.getByTestId('stat-placeholder');
      await expect(stat.locator('.cx-ui-statistic__value')).toHaveText('-');
    });

    // ------------------------------------------------------------------
    // Countdown (paused demos — deterministic initial render)
    // ------------------------------------------------------------------

    test('paused Countdown renders the static formatted duration at precision=0', async ({
      page,
    }) => {
      // 3_600_000 ms = 1 hour → "01:00:00"
      const cd = page.getByTestId('countdown-basic');
      await expect(cd).toHaveClass(/cx-ui-countdown--paused/);
      await expect(cd.locator('.cx-ui-countdown__value')).toHaveText('01:00:00');
    });

    test('paused Countdown with precision=2 renders .SS fractional suffix', async ({ page }) => {
      const cd = page.getByTestId('countdown-precise');
      // duration starts displaying 3_600_000 → "01:00:00.00"
      await expect(cd.locator('.cx-ui-countdown__value')).toHaveText('01:00:00.00');
    });

    test('Countdown with label renders __label + day-spanning value', async ({ page }) => {
      const cd = page.getByTestId('countdown-with-label');
      // 86_400_000 ms = 24 hours → "24:00:00"
      await expect(cd).toHaveClass(/cx-ui-countdown--with-label/);
      await expect(cd.locator('.cx-ui-countdown__label')).toHaveText('Sale ends in');
      await expect(cd.locator('.cx-ui-countdown__value')).toHaveText('24:00:00');
    });

    test('all paused Countdowns carry --tabular-nums + --paused modifiers', async ({ page }) => {
      for (const testid of ['countdown-basic', 'countdown-precise', 'countdown-with-label']) {
        const cd = page.getByTestId(testid);
        await expect(cd).toHaveClass(/cx-ui-countdown--tabular-nums/);
        await expect(cd).toHaveClass(/cx-ui-countdown--paused/);
      }
    });

    // ------------------------------------------------------------------
    // Style injection — each component injects exactly one <style>
    // ------------------------------------------------------------------

    test('Result + Statistic + Countdown stylesheets injected exactly once each', async ({
      page,
    }) => {
      expect(await page.locator('style[data-chronix-ui="result"]').count()).toBe(1);
      expect(await page.locator('style[data-chronix-ui="statistic"]').count()).toBe(1);
      expect(await page.locator('style[data-chronix-ui="countdown"]').count()).toBe(1);
    });
  });
}
