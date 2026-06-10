import { expect, test, type Page } from '@playwright/test';

import {
  CHRONIX_UI_REACT_DEMO_URL,
  CHRONIX_UI_VUE2_DEMO_URL,
  CHRONIX_UI_VUE3_DEMO_URL,
} from '../src/config.js';

/**
 * chronix-ui Watermark + QrCode + Marquee behavioral smoke —
 * Phase 22 (2026-06-03). TARGETS-loop pattern over 3 adapters.
 *
 * Phase 22 friction notes:
 *
 * - 22-fr1 — SVG `data:` URL in `background-image` reads back
 *   URL-encoded. Playwright uses `.toContain('data:image/svg+xml')`.
 * - 22-fr2 — CSS `@keyframes` rules use the namespaced name
 *   `cx-ui-marquee-scroll-{direction}`.
 *
 * Each demo's main.ts calls `registerQrCodeEncoder(qrcode)`, so
 * `qrcode-*` testids fingerprint to the active SVG state.
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
  test.describe(`chronix-ui ${name} / Phase 22 Watermark+QrCode+Marquee smoke`, () => {
    test.beforeEach(async ({ page }) => {
      await visitDemo(page, url);
    });

    // ------------------------------------------------------------------
    // Watermark
    // ------------------------------------------------------------------

    test('Watermark default — root tag is DIV with the base class', async ({ page }) => {
      const root = page.getByTestId('watermark-default');
      const tag = await root.evaluate((el) => el.tagName);
      expect(tag).toBe('DIV');
      await expect(root).toHaveClass(/cx-ui-watermark/);
    });

    test('Watermark default — root style.backgroundImage contains a SVG data URL', async ({
      page,
    }) => {
      const root = page.getByTestId('watermark-default');
      const bgImg = await root.evaluate((el) => (el as HTMLElement).style.backgroundImage);
      expect(bgImg).toContain('data:image/svg+xml');
    });

    test('Watermark default — root style.backgroundSize matches default 200x80', async ({
      page,
    }) => {
      const root = page.getByTestId('watermark-default');
      const bgSize = await root.evaluate((el) => (el as HTMLElement).style.backgroundSize);
      // Browser may serialize as "200px 80px" — accept either order.
      expect(bgSize).toMatch(/200px\s+80px/);
    });

    test('Watermark large — root style.backgroundSize matches 320x120', async ({ page }) => {
      const root = page.getByTestId('watermark-large');
      const bgSize = await root.evaluate((el) => (el as HTMLElement).style.backgroundSize);
      expect(bgSize).toMatch(/320px\s+120px/);
    });

    test('Watermark renders a __content child wrapping its slot', async ({ page }) => {
      const root = page.getByTestId('watermark-default');
      await expect(root.locator('.cx-ui-watermark__content')).toHaveCount(1);
    });

    // ------------------------------------------------------------------
    // QrCode
    // ------------------------------------------------------------------

    test('QrCode default — root tag is DIV + base class + ec modifier; SVG rendered', async ({
      page,
    }) => {
      const root = page.getByTestId('qrcode-default');
      const tag = await root.evaluate((el) => el.tagName);
      expect(tag).toBe('DIV');
      await expect(root).toHaveClass(/cx-ui-qrcode--ec-M/);
      await expect(root).not.toHaveClass(/cx-ui-qrcode--unavailable/);
      await expect(root.locator('svg')).toHaveCount(1);
    });

    test('QrCode default — SVG renders the expected width attribute', async ({ page }) => {
      const svg = page.getByTestId('qrcode-default').locator('svg');
      await expect(svg).toHaveAttribute('width', '200');
      await expect(svg).toHaveAttribute('height', '200');
    });

    test('QrCode default — SVG renders many <rect> modules (>1, includes background)', async ({
      page,
    }) => {
      const rects = page.getByTestId('qrcode-default').locator('svg rect');
      const count = await rects.count();
      expect(count).toBeGreaterThan(10);
    });

    test('QrCode low-ec — carries --ec-L modifier', async ({ page }) => {
      const root = page.getByTestId('qrcode-low-ec');
      await expect(root).toHaveClass(/cx-ui-qrcode--ec-L/);
    });

    test('QrCode colored — at least one foreground rect uses the configured color', async ({
      page,
    }) => {
      const foregroundColor = '#18a058';
      const rects = page.getByTestId('qrcode-colored').locator('svg rect');
      const count = await rects.count();
      let matchedForeground = 0;
      for (let i = 0; i < count; i += 1) {
        const fill = await rects.nth(i).getAttribute('fill');
        if (fill === foregroundColor) matchedForeground += 1;
      }
      expect(matchedForeground).toBeGreaterThan(0);
    });

    test('QrCode large — SVG width = 256', async ({ page }) => {
      const svg = page.getByTestId('qrcode-large').locator('svg');
      await expect(svg).toHaveAttribute('width', '256');
    });

    // ------------------------------------------------------------------
    // Marquee
    // ------------------------------------------------------------------

    test('Marquee default — root + direction class', async ({ page }) => {
      const root = page.getByTestId('marquee-default');
      const tag = await root.evaluate((el) => el.tagName);
      expect(tag).toBe('DIV');
      await expect(root).toHaveClass(/cx-ui-marquee--direction-left/);
    });

    test('Marquee default — renders __track child + exactly TWO __copy children', async ({
      page,
    }) => {
      const root = page.getByTestId('marquee-default');
      await expect(root.locator('.cx-ui-marquee__track')).toHaveCount(1);
      await expect(root.locator('.cx-ui-marquee__copy')).toHaveCount(2);
    });

    test('Marquee default — __track style.animationName matches the namespaced direction name', async ({
      page,
    }) => {
      const track = page.getByTestId('marquee-default').locator('.cx-ui-marquee__track');
      const animationName = await track.evaluate((el) => (el as HTMLElement).style.animationName);
      expect(animationName).toBe('cx-ui-marquee-scroll-left');
    });

    test('Marquee right — __track carries the right keyframes name', async ({ page }) => {
      const track = page.getByTestId('marquee-right').locator('.cx-ui-marquee__track');
      const animationName = await track.evaluate((el) => (el as HTMLElement).style.animationName);
      expect(animationName).toBe('cx-ui-marquee-scroll-right');
    });

    test('Marquee up — __track carries the up keyframes name', async ({ page }) => {
      const track = page.getByTestId('marquee-up').locator('.cx-ui-marquee__track');
      const animationName = await track.evaluate((el) => (el as HTMLElement).style.animationName);
      expect(animationName).toBe('cx-ui-marquee-scroll-up');
    });

    test('Marquee pause-on-hover carries --pause-on-hover modifier', async ({ page }) => {
      const root = page.getByTestId('marquee-pause-on-hover');
      await expect(root).toHaveClass(/cx-ui-marquee--pause-on-hover/);
    });

    test('Marquee default — __track style.animationDuration is non-zero (content was measured)', async ({
      page,
    }) => {
      const track = page.getByTestId('marquee-default').locator('.cx-ui-marquee__track');
      const duration = await track.evaluate((el) => (el as HTMLElement).style.animationDuration);
      // Duration is a positive number followed by 's' (e.g. "8.42s").
      expect(duration).toMatch(/^\d+(\.\d+)?s$/);
      const numeric = parseFloat(duration);
      expect(numeric).toBeGreaterThan(0);
    });

    // ------------------------------------------------------------------
    // Style injection — each component injects exactly one <style>
    // ------------------------------------------------------------------

    test('Watermark + QrCode + Marquee stylesheets injected exactly once each', async ({
      page,
    }) => {
      expect(await page.locator('style[data-chronix-ui="watermark"]').count()).toBe(1);
      expect(await page.locator('style[data-chronix-ui="qrcode"]').count()).toBe(1);
      expect(await page.locator('style[data-chronix-ui="marquee"]').count()).toBe(1);
    });
  });
}
