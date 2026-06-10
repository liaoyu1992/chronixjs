import { expect, test, type Page } from '@playwright/test';

import {
  CHRONIX_UI_REACT_DEMO_URL,
  CHRONIX_UI_VUE2_DEMO_URL,
  CHRONIX_UI_VUE3_DEMO_URL,
} from '../src/config.js';

/**
 * chronix-ui Phase 24 Tier A finale behavioral smoke —
 * 2026-06-03. TARGETS-loop over 3 adapters. One smoke spec covers
 * all 12 components per the compressed cookbook.
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
  test.describe(`chronix-ui ${name} / Phase 24 Tier A finale smoke`, () => {
    test.beforeEach(async ({ page }) => {
      await visitDemo(page, url);
    });

    test('ButtonGroup — <div role="group"> with --horizontal + 3 buttons', async ({ page }) => {
      const root = page.getByTestId('phase24-button-group');
      expect(await root.evaluate((el) => el.tagName)).toBe('DIV');
      expect(await root.getAttribute('role')).toBe('group');
      await expect(root).toHaveClass(/cx-ui-button-group--horizontal/);
      const buttons = root.locator('button.cx-ui-button');
      await expect(buttons).toHaveCount(3);
    });

    test('Element — custom tag is SECTION', async ({ page }) => {
      const root = page.getByTestId('phase24-element');
      expect(await root.evaluate((el) => el.tagName)).toBe('SECTION');
      await expect(root).toHaveClass(/cx-ui-element/);
    });

    test('Typography — variant=title level=3 renders <h3> + --level-3', async ({ page }) => {
      const root = page.getByTestId('phase24-typography');
      expect(await root.evaluate((el) => el.tagName)).toBe('H3');
      await expect(root).toHaveClass(/cx-ui-typography--level-3/);
    });

    test('Code — <pre><code> structure with multi-line content', async ({ page }) => {
      const root = page.getByTestId('phase24-code');
      expect(await root.evaluate((el) => el.tagName)).toBe('PRE');
      await expect(root).toHaveClass(/cx-ui-code--block/);
      await expect(root.locator('code')).toHaveCount(1);
    });

    test('GradientText — inline style.background contains linear-gradient', async ({ page }) => {
      const root = page.getByTestId('phase24-gradient-text');
      const bg = await root.evaluate((el) => (el as HTMLElement).style.background);
      expect(bg).toContain('linear-gradient');
      await expect(root).toHaveText('Rainbow gradient text');
    });

    test('Highlight — wraps the pattern in <mark.cx-ui-highlight__match>', async ({ page }) => {
      const root = page.getByTestId('phase24-highlight');
      const marks = root.locator('mark.cx-ui-highlight__match');
      await expect(marks).toHaveCount(1);
      await expect(marks.first()).toHaveText('quick');
    });

    test('Avatar — <span> base + --circle by default with text', async ({ page }) => {
      const root = page.getByTestId('phase24-avatar');
      expect(await root.evaluate((el) => el.tagName)).toBe('SPAN');
      await expect(root).toHaveClass(/cx-ui-avatar--circle/);
      await expect(root).toHaveText('AB');
    });

    test('AvatarGroup — renders max-1 avatars + overflow indicator', async ({ page }) => {
      const root = page.getByTestId('phase24-avatar-group');
      // 7 items, max=5 → 4 visible avatars + 1 overflow ("+3")
      await expect(root.locator('.cx-ui-avatar')).toHaveCount(5);
      const overflow = root.locator('.cx-ui-avatar-group__overflow');
      await expect(overflow).toHaveCount(1);
      await expect(overflow).toHaveText('+3');
    });

    test('IconWrapper — <span> base + width/height inline style', async ({ page }) => {
      const root = page.getByTestId('phase24-icon-wrapper');
      expect(await root.evaluate((el) => el.tagName)).toBe('SPAN');
      const style = await root.getAttribute('style');
      expect(style).not.toBeNull();
      expect(style!).toMatch(/width:\s*32px/);
      expect(style!).toMatch(/height:\s*32px/);
    });

    test('Icon — <svg> root for registered "check" with paths', async ({ page }) => {
      const root = page.getByTestId('phase24-icon');
      expect((await root.evaluate((el) => el.tagName)).toLowerCase()).toBe('svg');
      await expect(root).toHaveClass(/cx-ui-icon/);
      await expect(root).not.toHaveClass(/cx-ui-icon--missing/);
      const paths = root.locator('path');
      expect(await paths.count()).toBeGreaterThan(0);
    });

    test('Equation — <math> root with --block + MathML content', async ({ page }) => {
      const root = page.getByTestId('phase24-equation');
      expect((await root.evaluate((el) => el.tagName)).toLowerCase()).toBe('math');
      await expect(root).toHaveClass(/cx-ui-equation--block/);
      const html = (await root.innerHTML()).toLowerCase();
      expect(html).toContain('mi');
    });

    test('Heatmap — <svg> root with 4×5 = 20 <rect> cells', async ({ page }) => {
      const root = page.getByTestId('phase24-heatmap');
      expect((await root.evaluate((el) => el.tagName)).toLowerCase()).toBe('svg');
      await expect(root.locator('rect.cx-ui-heatmap__cell')).toHaveCount(20);
      expect(await root.getAttribute('width')).toBe('120');
      expect(await root.getAttribute('height')).toBe('96');
    });
  });
}
