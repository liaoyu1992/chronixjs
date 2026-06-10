import { expect, test, type Page } from '@playwright/test';

import {
  CHRONIX_UI_REACT_DEMO_URL,
  CHRONIX_UI_VUE2_DEMO_URL,
  CHRONIX_UI_VUE3_DEMO_URL,
} from '../src/config.js';

/**
 * chronix-ui 3-adapter Alert + Card + Empty parity spec — Phase 15
 * (2026-06-02). Verbatim shape match: same testid → same sorted
 * class set + same tag name + same text content + same role
 * attribute across vue3 / vue2 / react.
 *
 * Requires all 3 dev servers running (8731 / 8732 / 8733).
 */

const ALERT_TESTIDS = [
  'alert-default',
  'alert-info',
  'alert-success',
  'alert-warning',
  'alert-error',
  'alert-closable',
] as const;

const CARD_TESTIDS = ['card-basic', 'card-with-footer', 'card-hoverable', 'card-embedded'] as const;

const EMPTY_TESTIDS = ['empty-default', 'empty-small', 'empty-with-action'] as const;

interface ElementFingerprint {
  readonly tagName: string;
  readonly classes: string[];
  readonly role: string | null;
}

async function fingerprint(page: Page, testid: string): Promise<ElementFingerprint> {
  const locator = page.getByTestId(testid);
  await expect(locator).toBeAttached();
  const data = await locator.evaluate((el) => ({
    tagName: el.tagName,
    classAttr: el.getAttribute('class') ?? '',
    role: el.getAttribute('role'),
  }));
  const classes = Array.from(new Set(data.classAttr.split(/\s+/).filter(Boolean))).sort();
  return { tagName: data.tagName, classes, role: data.role };
}

function makeParityBlock(describe: string, testids: readonly string[], styleName: string): void {
  test.describe(describe, () => {
    for (const testid of testids) {
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
          expect(vue2Fp.classes, `vue2 class set diverges for ${testid}`).toEqual(vue3Fp.classes);
          expect(reactFp.classes, `react class set diverges for ${testid}`).toEqual(vue3Fp.classes);
          expect(vue2Fp.role, `vue2 role diverges for ${testid}`).toBe(vue3Fp.role);
          expect(reactFp.role, `react role diverges for ${testid}`).toBe(vue3Fp.role);
        } finally {
          await ctx.close();
        }
      });
    }

    test(`every demo injects exactly one stylesheet with data-chronix-ui="${styleName}"`, async ({
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
            p.locator(`style[data-chronix-ui="${styleName}"]`).count(),
          ),
        );
        expect(counts).toEqual([1, 1, 1]);
      } finally {
        await ctx.close();
      }
    });
  });
}

makeParityBlock('chronix-ui / Alert 3-adapter parity', ALERT_TESTIDS, 'alert');
makeParityBlock('chronix-ui / Card 3-adapter parity', CARD_TESTIDS, 'card');
makeParityBlock('chronix-ui / Empty 3-adapter parity', EMPTY_TESTIDS, 'empty');
