import { expect, test, type Page } from '@playwright/test';

import {
  CHRONIX_UI_REACT_DEMO_URL,
  CHRONIX_UI_VUE2_DEMO_URL,
  CHRONIX_UI_VUE3_DEMO_URL,
} from '../src/config.js';

/**
 * chronix-ui 3-adapter Tag + Divider parity spec — Phase 13 (2026-06-02).
 *
 * Runs all three Phase 13 demos in lockstep and asserts that the same
 * `data-testid` produces the same sorted set of DOM class names + the
 * same critical attributes across vue3 / vue2 / react.
 *
 * Sibling of `ui-button-parity.spec.ts` (Phase 12). Per-component
 * parity specs let test failures stay surface-isolated — a divergence
 * in Tag class generation doesn't pollute the Button parity baseline.
 *
 * Requires all 3 dev servers running (8731 / 8732 / 8733) before
 * invocation.
 */

const TAG_TESTIDS = [
  'tag-default',
  'tag-primary',
  'tag-info',
  'tag-success',
  'tag-warning',
  'tag-error',
  'tag-small',
  'tag-medium',
  'tag-large',
  'tag-round',
  'tag-closable',
  'tag-disabled',
] as const;

const DIVIDER_TESTIDS = [
  'divider-section',
  'divider-default',
  'divider-left',
  'divider-right',
  'divider-dashed',
  'divider-vertical',
] as const;

interface ElementFingerprint {
  readonly tagName: string;
  readonly classes: string[];
  readonly role: string | null;
  readonly ariaLabel: string | null;
}

async function fingerprint(page: Page, testid: string): Promise<ElementFingerprint> {
  const locator = page.getByTestId(testid);
  await expect(locator).toBeAttached();
  const data = await locator.evaluate((el) => ({
    tagName: el.tagName,
    classAttr: el.getAttribute('class') ?? '',
    role: el.getAttribute('role'),
    ariaLabel: el.getAttribute('aria-label'),
  }));
  const classes = Array.from(new Set(data.classAttr.split(/\s+/).filter(Boolean))).sort();
  return {
    tagName: data.tagName,
    classes,
    role: data.role,
    ariaLabel: data.ariaLabel,
  };
}

test.describe('chronix-ui / Tag 3-adapter parity', () => {
  for (const testid of TAG_TESTIDS) {
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

        expect(vue2Fp.tagName, `vue2 tag-name diverges for ${testid}`).toBe(vue3Fp.tagName);
        expect(reactFp.tagName, `react tag-name diverges for ${testid}`).toBe(vue3Fp.tagName);
        expect(vue2Fp.classes, `vue2 class set diverges for ${testid}`).toEqual(vue3Fp.classes);
        expect(reactFp.classes, `react class set diverges for ${testid}`).toEqual(vue3Fp.classes);
      } finally {
        await ctx.close();
      }
    });
  }

  test('every Tag mounts a single stylesheet with data-chronix-ui="tag" per demo', async ({
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
          p.locator('style[data-chronix-ui="tag"]').count(),
        ),
      );
      expect(counts).toEqual([1, 1, 1]);
    } finally {
      await ctx.close();
    }
  });
});

test.describe('chronix-ui / Divider 3-adapter parity', () => {
  for (const testid of DIVIDER_TESTIDS) {
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

        expect(vue2Fp.tagName, `vue2 tag-name diverges for ${testid}`).toBe(vue3Fp.tagName);
        expect(reactFp.tagName, `react tag-name diverges for ${testid}`).toBe(vue3Fp.tagName);
        expect(vue2Fp.classes, `vue2 class set diverges for ${testid}`).toEqual(vue3Fp.classes);
        expect(reactFp.classes, `react class set diverges for ${testid}`).toEqual(vue3Fp.classes);
        expect(vue2Fp.role, `vue2 role diverges for ${testid}`).toBe(vue3Fp.role);
        expect(reactFp.role, `react role diverges for ${testid}`).toBe(vue3Fp.role);
      } finally {
        await ctx.close();
      }
    });
  }

  test('every Divider mounts a single stylesheet with data-chronix-ui="divider" per demo', async ({
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
          p.locator('style[data-chronix-ui="divider"]').count(),
        ),
      );
      expect(counts).toEqual([1, 1, 1]);
    } finally {
      await ctx.close();
    }
  });
});
