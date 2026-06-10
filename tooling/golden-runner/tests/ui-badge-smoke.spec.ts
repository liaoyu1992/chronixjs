import { expect, test, type Page } from '@playwright/test';

import {
  CHRONIX_UI_REACT_DEMO_URL,
  CHRONIX_UI_VUE2_DEMO_URL,
  CHRONIX_UI_VUE3_DEMO_URL,
} from '../src/config.js';

/**
 * chronix-ui Badge behavioral smoke — Phase 14 (2026-06-02). Single
 * spec covering all 3 adapters; mirrors the Phase 13 Tag+Divider
 * smoke shape (`ui-tag-divider-smoke.spec.ts`).
 *
 * Asserts:
 *
 * - Truncation works at the demo level (`max=99`, `value=999` → "99+").
 * - String values pass through.
 * - 5 type modifiers all render.
 * - Dot / processing / hidden modifiers render.
 * - Wrapped-mode badges (`badge-wrapping-*`) wrap a `ChronixButton`
 *   sibling and DON'T carry `--standalone` modifier.
 * - Standalone badges (`badge-*` without `-wrapping-`) DO carry
 *   `--standalone`.
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
  test.describe(`chronix-ui ${name} / Phase 14 Badge smoke`, () => {
    test.beforeEach(async ({ page }) => {
      await visitDemo(page, url);
    });

    test('numeric / truncated / string standalone badges render correct text', async ({ page }) => {
      await expect(page.getByTestId('badge-numeric').locator('.cx-ui-badge__sup')).toHaveText('5');
      await expect(page.getByTestId('badge-truncated').locator('.cx-ui-badge__sup')).toHaveText(
        '99+',
      );
      await expect(page.getByTestId('badge-string').locator('.cx-ui-badge__sup')).toHaveText('NEW');
    });

    test('all 5 Badge types render with matching --type modifier on __sup', async ({ page }) => {
      for (const t of ['default', 'success', 'warning', 'error', 'info'] as const) {
        await expect(page.getByTestId(`badge-type-${t}`).locator('.cx-ui-badge__sup')).toHaveClass(
          new RegExp(`cx-ui-badge__sup--${t}`),
        );
      }
    });

    test('dot / processing / hidden modifiers render on __sup', async ({ page }) => {
      await expect(page.getByTestId('badge-dot').locator('.cx-ui-badge__sup')).toHaveClass(
        /cx-ui-badge__sup--dot/,
      );
      await expect(page.getByTestId('badge-processing').locator('.cx-ui-badge__sup')).toHaveClass(
        /cx-ui-badge__sup--processing/,
      );
      await expect(page.getByTestId('badge-hidden').locator('.cx-ui-badge__sup')).toHaveClass(
        /cx-ui-badge__sup--hidden/,
      );
    });

    test('standalone badges carry --standalone root modifier', async ({ page }) => {
      await expect(page.getByTestId('badge-numeric')).toHaveClass(/cx-ui-badge--standalone/);
      await expect(page.getByTestId('badge-type-success')).toHaveClass(/cx-ui-badge--standalone/);
      await expect(page.getByTestId('badge-dot')).toHaveClass(/cx-ui-badge--standalone/);
    });

    test('wrapped-mode badges DO NOT carry --standalone root modifier', async ({ page }) => {
      for (const id of [
        'badge-wrapping-numeric',
        'badge-wrapping-dot',
        'badge-wrapping-trunc',
      ] as const) {
        await expect(page.getByTestId(id)).not.toHaveClass(/cx-ui-badge--standalone/);
      }
    });

    test('wrapped Badge contains both the wrapped Button child and the __sup overlay', async ({
      page,
    }) => {
      const wrap = page.getByTestId('badge-wrapping-numeric');
      // Wrapped child: a ChronixButton with the "Inbox" label.
      await expect(wrap.locator('button.cx-ui-button')).toHaveText('Inbox');
      // Overlay sup carries the numeric value.
      await expect(wrap.locator('.cx-ui-badge__sup')).toHaveText('3');
    });

    test('Badge stylesheet injected exactly once', async ({ page }) => {
      const count = await page.locator('style[data-chronix-ui="badge"]').count();
      expect(count).toBe(1);
    });
  });
}
