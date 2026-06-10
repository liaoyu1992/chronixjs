import { expect, test, type Page } from '@playwright/test';

import {
  CHRONIX_UI_REACT_DEMO_URL,
  CHRONIX_UI_VUE2_DEMO_URL,
  CHRONIX_UI_VUE3_DEMO_URL,
} from '../src/config.js';

/**
 * chronix-ui Phase 27 Popover-consuming Tier B parity — 2026-06-03,
 * updated 2026-06-08. 6 testids (Modal / Drawer / Dropdown / Menu / Affix / BackTop)
 * fingerprinted across vue3 / vue2 / react.
 *
 * Modal, Drawer, and Dropdown start closed in demos — tests open them
 * via toggle buttons before fingerprinting.
 */

const PHASE27_TESTIDS = [
  'phase27-modal',
  'phase27-drawer',
  'phase27-dropdown',
  'phase27-menu',
  'phase27-affix',
  'phase27-back-top',
] as const;

const STYLE_NAMES = ['modal', 'drawer', 'dropdown', 'menu', 'affix', 'back-top'] as const;

/** Testids that need a toggle-button click before they appear in the DOM. */
const TOGGLE_TESTIDS = new Set(['phase27-modal', 'phase27-drawer']);

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

/** Open a toggle-controlled component via its toggle button. */
async function openViaToggle(page: Page, testid: string): Promise<void> {
  if (testid === 'phase27-modal') {
    await page.getByTestId('phase27-modal-toggle').click();
  } else if (testid === 'phase27-drawer') {
    await page.getByTestId('phase27-drawer-toggle').click();
  }
}

test.describe('chronix-ui / Phase 27 Popover-consuming Tier B 3-adapter parity', () => {
  for (const testid of PHASE27_TESTIDS) {
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

        // Open toggle-controlled components on all 3 pages
        if (TOGGLE_TESTIDS.has(testid)) {
          await Promise.all([
            openViaToggle(vue3Page, testid),
            openViaToggle(vue2Page, testid),
            openViaToggle(reactPage, testid),
          ]);
        }

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

  test('every demo injects exactly one stylesheet per Phase 27 component', async ({ browser }) => {
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
      for (const styleName of STYLE_NAMES) {
        const counts = await Promise.all(
          [vue3Page, vue2Page, reactPage].map((p) =>
            p.locator(`style[data-chronix-ui="${styleName}"]`).count(),
          ),
        );
        expect(counts, `style[data-chronix-ui="${styleName}"]`).toEqual([1, 1, 1]);
      }
    } finally {
      await ctx.close();
    }
  });
});
