import { expect, test, type Page } from '@playwright/test';

import {
  CHRONIX_UI_REACT_DEMO_URL,
  CHRONIX_UI_VUE2_DEMO_URL,
  CHRONIX_UI_VUE3_DEMO_URL,
} from '../src/config.js';

/**
 * chronix-ui 3-adapter Badge parity spec — Phase 14 (2026-06-02).
 *
 * Runs all three Phase 14 demos in lockstep and asserts that the same
 * `data-testid` produces:
 *
 * - the same root + inner `__sup` class sets (sorted, deduped)
 * - the same displayed text (numeric truncation / string passthrough)
 * - the same standalone vs wrapped mode (root carries
 *   `--standalone` modifier iff the markup has no wrapped child)
 *
 * Requires all 3 dev servers running (8731 / 8732 / 8733) before
 * invocation.
 */

const BADGE_TESTIDS = [
  'badge-numeric',
  'badge-truncated',
  'badge-string',
  'badge-type-default',
  'badge-type-success',
  'badge-type-warning',
  'badge-type-error',
  'badge-type-info',
  'badge-dot',
  'badge-processing',
  'badge-hidden',
  'badge-wrapping-numeric',
  'badge-wrapping-dot',
  'badge-wrapping-trunc',
] as const;

interface BadgeFingerprint {
  readonly tagName: string;
  readonly rootClasses: string[];
  readonly supClasses: string[];
  readonly supText: string;
}

async function fingerprint(page: Page, testid: string): Promise<BadgeFingerprint> {
  const locator = page.getByTestId(testid);
  await expect(locator).toBeAttached();
  const data = await locator.evaluate((el) => {
    const sup = el.querySelector('.cx-ui-badge__sup');
    return {
      tagName: el.tagName,
      rootClassAttr: el.getAttribute('class') ?? '',
      supClassAttr: sup?.getAttribute('class') ?? '',
      supText: sup?.textContent ?? '',
    };
  });
  const rootClasses = Array.from(new Set(data.rootClassAttr.split(/\s+/).filter(Boolean))).sort();
  const supClasses = Array.from(new Set(data.supClassAttr.split(/\s+/).filter(Boolean))).sort();
  return {
    tagName: data.tagName,
    rootClasses,
    supClasses,
    supText: data.supText,
  };
}

test.describe('chronix-ui / Badge 3-adapter parity', () => {
  for (const testid of BADGE_TESTIDS) {
    test(`testid "${testid}" produces identical DOM fingerprints across vue3 / vue2 / react`, async ({
      browser,
    }) => {
      const ctx = await browser.newContext();
      const [vue3Page, vue2Page, reactPage] = await Promise.all([
        ctx.newPage(),
        ctx.newPage(),
        ctx.newPage(),
      ]);
      try {
        await Promise.all([
          vue3Page.goto(CHRONIX_UI_VUE3_DEMO_URL),
          vue2Page.goto(CHRONIX_UI_VUE2_DEMO_URL),
          reactPage.goto(CHRONIX_UI_REACT_DEMO_URL),
        ]);
        await Promise.all([
          expect(vue3Page.getByTestId('demo-page')).toBeVisible(),
          expect(vue2Page.getByTestId('demo-page')).toBeVisible(),
          expect(reactPage.getByTestId('demo-page')).toBeVisible(),
        ]);

        const [vue3Fp, vue2Fp, reactFp] = await Promise.all([
          fingerprint(vue3Page, testid),
          fingerprint(vue2Page, testid),
          fingerprint(reactPage, testid),
        ]);

        expect(vue2Fp.tagName, `vue2 root tag diverges for ${testid}`).toBe(vue3Fp.tagName);
        expect(reactFp.tagName, `react root tag diverges for ${testid}`).toBe(vue3Fp.tagName);

        expect(vue2Fp.rootClasses, `vue2 root class set diverges for ${testid}`).toEqual(
          vue3Fp.rootClasses,
        );
        expect(reactFp.rootClasses, `react root class set diverges for ${testid}`).toEqual(
          vue3Fp.rootClasses,
        );

        expect(vue2Fp.supClasses, `vue2 __sup class set diverges for ${testid}`).toEqual(
          vue3Fp.supClasses,
        );
        expect(reactFp.supClasses, `react __sup class set diverges for ${testid}`).toEqual(
          vue3Fp.supClasses,
        );

        expect(vue2Fp.supText, `vue2 __sup text diverges for ${testid}`).toBe(vue3Fp.supText);
        expect(reactFp.supText, `react __sup text diverges for ${testid}`).toBe(vue3Fp.supText);
      } finally {
        await ctx.close();
      }
    });
  }

  test('every Badge demo injects exactly one stylesheet with data-chronix-ui="badge"', async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const [vue3Page, vue2Page, reactPage] = await Promise.all([
      ctx.newPage(),
      ctx.newPage(),
      ctx.newPage(),
    ]);
    try {
      await Promise.all([
        vue3Page.goto(CHRONIX_UI_VUE3_DEMO_URL),
        vue2Page.goto(CHRONIX_UI_VUE2_DEMO_URL),
        reactPage.goto(CHRONIX_UI_REACT_DEMO_URL),
      ]);
      const counts = await Promise.all(
        [vue3Page, vue2Page, reactPage].map((p) =>
          p.locator('style[data-chronix-ui="badge"]').count(),
        ),
      );
      expect(counts).toEqual([1, 1, 1]);
    } finally {
      await ctx.close();
    }
  });
});
