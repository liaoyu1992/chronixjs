import { expect, test, type Page } from '@playwright/test';

import {
  CHRONIX_UI_REACT_DEMO_URL,
  CHRONIX_UI_VUE2_DEMO_URL,
  CHRONIX_UI_VUE3_DEMO_URL,
} from '../src/config.js';

/**
 * chronix-ui 3-adapter Button parity spec — Phase 12 (2026-06-02).
 *
 * Runs all three Phase 12 Button demos in lockstep and asserts that
 * the same `data-testid` produces:
 *
 * - the same sorted set of DOM class names
 * - the same `type` HTML attribute
 * - the same `aria-disabled` HTML attribute
 * - the same `disabled` HTML attribute presence
 *
 * Cross-adapter parity is structural-by-construction (all three
 * adapters consume `resolveButtonClassList` from `@chronixjs/ui`
 * core + the same injected `CHRONIX_BUTTON_CSS`). This spec is the
 * automated guard that the construction stays intact across future
 * component phases — any divergence is either a new adapter regression
 * or an unintentional Vue-specific / React-specific render-time
 * mutation.
 *
 * Requires all 3 dev servers running (8731 / 8732 / 8733) before
 * invocation; see UI_MIGRATION_PLAN.md Phase 12 verification gate.
 */

const TESTIDS = [
  'btn-default',
  'btn-primary',
  'btn-small',
  'btn-medium',
  'btn-large',
  'btn-disabled',
  'btn-block',
  'btn-increment',
  'btn-increment-primary',
] as const;

interface ButtonFingerprint {
  readonly classes: string[]; // sorted, deduped
  readonly type: string | null;
  readonly ariaDisabled: string | null;
  readonly hasDisabledAttr: boolean;
}

async function fingerprint(page: Page, testid: string): Promise<ButtonFingerprint> {
  const locator = page.getByTestId(testid);
  await expect(locator).toBeVisible();
  const classAttr = (await locator.getAttribute('class')) ?? '';
  const classes = Array.from(new Set(classAttr.split(/\s+/).filter(Boolean))).sort();
  const type = await locator.getAttribute('type');
  const ariaDisabled = await locator.getAttribute('aria-disabled');
  const hasDisabledAttr = (await locator.getAttribute('disabled')) !== null;
  return { classes, type, ariaDisabled, hasDisabledAttr };
}

test.describe('chronix-ui / Button 3-adapter parity', () => {
  for (const testid of TESTIDS) {
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

        // Class set must be byte-identical across the 3 adapters.
        expect(vue2Fp.classes, `vue2 vs vue3 class set diverges for ${testid}`).toEqual(
          vue3Fp.classes,
        );
        expect(reactFp.classes, `react vs vue3 class set diverges for ${testid}`).toEqual(
          vue3Fp.classes,
        );

        // Critical HTML attributes must also be byte-identical.
        expect(vue2Fp.type).toBe(vue3Fp.type);
        expect(reactFp.type).toBe(vue3Fp.type);
        expect(vue2Fp.ariaDisabled).toBe(vue3Fp.ariaDisabled);
        expect(reactFp.ariaDisabled).toBe(vue3Fp.ariaDisabled);
        expect(vue2Fp.hasDisabledAttr).toBe(vue3Fp.hasDisabledAttr);
        expect(reactFp.hasDisabledAttr).toBe(vue3Fp.hasDisabledAttr);
      } finally {
        await ctx.close();
      }
    });
  }

  test('the provider root .cx-ui-provider exists in all 3 demos and carries identical CSS-var keys', async ({
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

      const styleSets = await Promise.all(
        [vue3Page, vue2Page, reactPage].map(async (p) => {
          const provider = p.locator('.cx-ui-provider').first();
          await expect(provider).toBeAttached();
          const style = (await provider.getAttribute('style')) ?? '';
          // Extract the set of CSS-var names (left of the colon) from the
          // inline style string. Order across adapters may differ; the
          // SET must match.
          const matches = style.match(/--cx-ui-[a-z0-9-]+/g) ?? [];
          return new Set(matches);
        }),
      );
      const [vue3Set, vue2Set, reactSet] = styleSets;
      expect(vue2Set, 'vue2 CSS-var keys diverge from vue3').toEqual(vue3Set);
      expect(reactSet, 'react CSS-var keys diverge from vue3').toEqual(vue3Set);
    } finally {
      await ctx.close();
    }
  });

  test('each demo injects exactly one stylesheet with data-chronix-ui="button"', async ({
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
          p.locator('style[data-chronix-ui="button"]').count(),
        ),
      );
      expect(counts).toEqual([1, 1, 1]);
    } finally {
      await ctx.close();
    }
  });
});
