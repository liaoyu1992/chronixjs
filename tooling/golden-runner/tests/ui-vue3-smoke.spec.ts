import { expect, test } from '@playwright/test';

import { CHRONIX_UI_VUE3_DEMO_URL } from '../src/config.js';

/**
 * chronix-ui vue3 Phase 11 Button smoke spec — Phase 10 (2026-06-02).
 *
 * Drives the dev server at port 8731 (start with
 * `pnpm --filter @chronixjs/example-ui-vue3 dev` before running this
 * spec). Verifies the first real-component end-to-end contract:
 *
 * - The provider + button render together
 * - Variants and sizes produce the expected BEM class names
 * - Click events fire and update the demo's reactive counter
 * - Disabled buttons suppress click side-effects
 * - The provider root carries `--cx-ui-*` CSS custom properties so
 *   downstream component CSS resolves token values
 *
 * Future Tier B/C components extend this file (or split into per-
 * component spec files) as they land. Cross-adapter parity assertions
 * across vue3 / vue2 / react are added in Phase 12 once those adapter
 * packages exist.
 */

test.describe('chronix-ui vue3 / Phase 11 Button smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CHRONIX_UI_VUE3_DEMO_URL);
    await expect(page.getByTestId('demo-page')).toBeVisible();
  });

  test('renders default + primary variant buttons', async ({ page }) => {
    const def = page.getByTestId('btn-default');
    const prim = page.getByTestId('btn-primary');
    await expect(def).toHaveClass(/cx-ui-button--default/);
    await expect(prim).toHaveClass(/cx-ui-button--primary/);
    await expect(def).toHaveText('Default');
    await expect(prim).toHaveText('Primary');
  });

  test('renders 3 size variants', async ({ page }) => {
    await expect(page.getByTestId('btn-small')).toHaveClass(/cx-ui-button--small/);
    await expect(page.getByTestId('btn-medium')).toHaveClass(/cx-ui-button--medium/);
    await expect(page.getByTestId('btn-large')).toHaveClass(/cx-ui-button--large/);
  });

  test('block button takes full width', async ({ page }) => {
    const block = page.getByTestId('btn-block');
    await expect(block).toHaveClass(/cx-ui-button--block/);
    // The block button's bounding rect should be wider than a non-block one.
    const blockBox = await block.boundingBox();
    const refBox = await page.getByTestId('btn-default').boundingBox();
    expect(blockBox).not.toBeNull();
    expect(refBox).not.toBeNull();
    expect(blockBox!.width).toBeGreaterThan(refBox!.width * 3);
  });

  test('disabled button carries the BEM modifier + ARIA attribute', async ({ page }) => {
    const disabled = page.getByTestId('btn-disabled');
    await expect(disabled).toHaveClass(/cx-ui-button--disabled/);
    await expect(disabled).toHaveAttribute('aria-disabled', 'true');
    await expect(disabled).toBeDisabled();
  });

  test('clicking a button increments the active counter', async ({ page }) => {
    const counter = page.getByTestId('counter-active');
    await expect(counter).toHaveText('0');
    await page.getByTestId('btn-increment').click();
    await expect(counter).toHaveText('1');
    await page.getByTestId('btn-increment-primary').click();
    await expect(counter).toHaveText('2');
  });

  test('clicking the disabled button does NOT increment its counter', async ({ page }) => {
    const counter = page.getByTestId('counter-blocked');
    await expect(counter).toHaveText('0');
    // `click()` with force: true bypasses Playwright's actionability checks
    // so we exercise the click handler's preventDefault gate (Phase 11
    // adapter behavior) rather than the disabled-pointer-events check.
    await page.getByTestId('btn-disabled').click({ force: true });
    await expect(counter).toHaveText('0');
  });

  test('provider root carries --cx-ui-* CSS custom properties', async ({ page }) => {
    const providerRoot = page.locator('.cx-ui-provider').first();
    await expect(providerRoot).toBeAttached();
    const styleAttr = await providerRoot.getAttribute('style');
    expect(styleAttr).not.toBeNull();
    expect(styleAttr!).toContain('--cx-ui-primary-color');
    expect(styleAttr!).toContain('--cx-ui-button-bg-color');
    expect(styleAttr!).toContain('--cx-ui-font-family');
  });

  test('button stylesheet is injected exactly once', async ({ page }) => {
    const styleCount = await page.locator('style[data-chronix-ui="button"]').count();
    expect(styleCount).toBe(1);
  });
});
