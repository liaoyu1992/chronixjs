import { expect, test, type Page } from '@playwright/test';

import {
  CHRONIX_UI_REACT_DEMO_URL,
  CHRONIX_UI_VUE2_DEMO_URL,
  CHRONIX_UI_VUE3_DEMO_URL,
} from '../src/config.js';

/**
 * chronix-ui Steps + Timeline behavioral smoke — Phase 20
 * (2026-06-03). TARGETS-loop pattern over 3 adapters.
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
  test.describe(`chronix-ui ${name} / Phase 20 Steps+Timeline smoke`, () => {
    test.beforeEach(async ({ page }) => {
      await visitDemo(page, url);
    });

    // ------------------------------------------------------------------
    // Steps
    // ------------------------------------------------------------------

    test('Steps default — item count + separator count formula', async ({ page }) => {
      const steps = page.getByTestId('steps-default');
      await expect(steps.locator('.cx-ui-steps__item')).toHaveCount(3);
      await expect(steps.locator('.cx-ui-steps__separator')).toHaveCount(2);
    });

    test('Steps default (current=1) yields finish/process/wait derived statuses', async ({
      page,
    }) => {
      const steps = page.getByTestId('steps-default');
      const items = steps.locator('.cx-ui-steps__item');
      await expect(items.nth(0)).toHaveClass(/cx-ui-steps__item--finish/);
      await expect(items.nth(1)).toHaveClass(/cx-ui-steps__item--process/);
      await expect(items.nth(1)).toHaveClass(/cx-ui-steps__item--current/);
      await expect(items.nth(2)).toHaveClass(/cx-ui-steps__item--wait/);
    });

    test('Steps default — indicator content is numeric for wait/process, ✓ for finish', async ({
      page,
    }) => {
      const steps = page.getByTestId('steps-default');
      const indices = steps.locator('.cx-ui-steps__index');
      await expect(indices.nth(0)).toHaveText('✓');
      await expect(indices.nth(1)).toHaveText('2');
      await expect(indices.nth(2)).toHaveText('3');
    });

    test('Steps vertical applies the --vertical direction modifier', async ({ page }) => {
      const steps = page.getByTestId('steps-vertical');
      await expect(steps).toHaveClass(/cx-ui-steps--vertical/);
    });

    test('Steps with-error applies --has-error aggregate + per-item --error modifier + ✕ indicator', async ({
      page,
    }) => {
      const steps = page.getByTestId('steps-with-error');
      await expect(steps).toHaveClass(/cx-ui-steps--has-error/);
      const items = steps.locator('.cx-ui-steps__item');
      await expect(items.nth(1)).toHaveClass(/cx-ui-steps__item--error/);
      await expect(items.nth(1).locator('.cx-ui-steps__index')).toHaveText('✕');
    });

    test('Steps all-done renders ✓ for every step', async ({ page }) => {
      const steps = page.getByTestId('steps-all-done');
      const indices = steps.locator('.cx-ui-steps__index');
      const count = await indices.count();
      for (let i = 0; i < count; i++) {
        await expect(indices.nth(i)).toHaveText('✓');
      }
    });

    test('Steps with-description renders __description elements', async ({ page }) => {
      const steps = page.getByTestId('steps-with-description');
      const descriptions = steps.locator('.cx-ui-steps__description');
      await expect(descriptions).toHaveCount(3);
      await expect(descriptions.nth(0)).toHaveText('Sketch the design doc');
    });

    test('Steps indicator carries aria-hidden="true" for screen readers', async ({ page }) => {
      const index = page.getByTestId('steps-default').locator('.cx-ui-steps__index').first();
      await expect(index).toHaveAttribute('aria-hidden', 'true');
    });

    // ------------------------------------------------------------------
    // Timeline
    // ------------------------------------------------------------------

    test('Timeline basic — renders one item per array entry', async ({ page }) => {
      const timeline = page.getByTestId('timeline-basic');
      await expect(timeline.locator('.cx-ui-timeline__item')).toHaveCount(3);
    });

    test('Timeline colors — per-item color modifier applied across all 5 variants', async ({
      page,
    }) => {
      const timeline = page.getByTestId('timeline-colors');
      const items = timeline.locator('.cx-ui-timeline__item');
      await expect(items.nth(0)).toHaveClass(/cx-ui-timeline__item--color-default/);
      await expect(items.nth(1)).toHaveClass(/cx-ui-timeline__item--color-success/);
      await expect(items.nth(2)).toHaveClass(/cx-ui-timeline__item--color-info/);
      await expect(items.nth(3)).toHaveClass(/cx-ui-timeline__item--color-warning/);
      await expect(items.nth(4)).toHaveClass(/cx-ui-timeline__item--color-error/);
    });

    test('Timeline dashed — every item carries --line-dashed modifier', async ({ page }) => {
      const timeline = page.getByTestId('timeline-dashed');
      const items = timeline.locator('.cx-ui-timeline__item');
      const count = await items.count();
      for (let i = 0; i < count; i++) {
        await expect(items.nth(i)).toHaveClass(/cx-ui-timeline__item--line-dashed/);
      }
    });

    test('Timeline last-item carries --last modifier and omits the __line element', async ({
      page,
    }) => {
      const timeline = page.getByTestId('timeline-basic');
      const items = timeline.locator('.cx-ui-timeline__item');
      const last = items.last();
      await expect(last).toHaveClass(/cx-ui-timeline__item--last/);
      await expect(last.locator('.cx-ui-timeline__line')).toHaveCount(0);
      // Non-last items still have __line.
      await expect(items.nth(0).locator('.cx-ui-timeline__line')).toHaveCount(1);
    });

    test('Timeline every item has a __dot element', async ({ page }) => {
      const timeline = page.getByTestId('timeline-basic');
      const itemsCount = await timeline.locator('.cx-ui-timeline__item').count();
      await expect(timeline.locator('.cx-ui-timeline__dot')).toHaveCount(itemsCount);
    });

    test('Timeline with-timestamp renders __title + __description + __timestamp', async ({
      page,
    }) => {
      const timeline = page.getByTestId('timeline-with-timestamp');
      const firstItem = timeline.locator('.cx-ui-timeline__item').first();
      await expect(firstItem.locator('.cx-ui-timeline__title')).toHaveText('Created project');
      await expect(firstItem.locator('.cx-ui-timeline__description')).toHaveText(
        'Initial commit on master',
      );
      await expect(firstItem.locator('.cx-ui-timeline__timestamp')).toHaveText('2026-06-01 09:00');
    });

    test('Timeline basic — items without description/timestamp do NOT render those elements', async ({
      page,
    }) => {
      const timeline = page.getByTestId('timeline-basic');
      await expect(timeline.locator('.cx-ui-timeline__description')).toHaveCount(0);
      await expect(timeline.locator('.cx-ui-timeline__timestamp')).toHaveCount(0);
    });

    // ------------------------------------------------------------------
    // Style injection — each component injects exactly one <style>
    // ------------------------------------------------------------------

    test('Steps + Timeline stylesheets injected exactly once each', async ({ page }) => {
      expect(await page.locator('style[data-chronix-ui="steps"]').count()).toBe(1);
      expect(await page.locator('style[data-chronix-ui="timeline"]').count()).toBe(1);
    });
  });
}
