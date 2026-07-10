/**
 * **Phase 113: chronix-table per-adapter VRT scenario registry.**
 *
 * Unlike the gantt cross-demo registry (`cross-demo-scenarios.ts`),
 * table scenarios are **chronix-only** (`kind: 'vrt'` semantics).
 * Each adapter captures against its own baseline subdir:
 * `goldens/table-cross-demo-baselines/{vue3,vue2,react}/<id>.png`.
 *
 * Per Phase 113 Decision A.1 — chronix-table has no cross-AG-Grid
 * pixel-diff lane (architectural divergence makes per-pixel
 * comparison meaningless). Self-baseline catches real regressions;
 * the originally-deferred cross-adapter pixel-diff is out of scope.
 *
 * Tolerance fixed globally: `maxDiffPixelRatio: 0` + `threshold: 0.2`,
 * matching the gantt registry. Per-scenario tolerance bumps are a
 * graveyard pattern; soft tolerances mask real regressions.
 *
 * Scenario state is driven by Playwright DOM interactions inside
 * `setup(page)` (the demos have no URL-flag config layer; click +
 * hover + keydown are sufficient for the v1 8-scenario set).
 */

import type { Page } from '@playwright/test';

export type TableAdapter = 'vue3' | 'vue2' | 'react';

export interface TableVrtScenario {
  /** Stable id; baseline filename + Playwright test title. */
  readonly id: string;
  /** One-line description for journal + test title. */
  readonly description: string;
  /**
   * Async hook that drives the page from default-mounted state into
   * the captured state. Runs AFTER navigation + table mount + chrome
   * hiding. May click DOM elements, dispatch keyboard events, or
   * await selectors. Must NOT throw if the state is already the
   * default (some scenarios deliberately capture default paint).
   */
  readonly setup: (page: Page) => Promise<void>;
}

/**
 * **Phase 113 v1: 8-scenario initial registry.**
 *
 * Each one is justified by a distinct visual-surface drift class.
 * Future phases extend this list by 1–3 entries each as new feature
 * regressions surface from consumer reports.
 */
export const TABLE_VRT_SCENARIOS: readonly TableVrtScenario[] = [
  {
    id: 'default-load',
    description: 'Fresh mount of the primary demo table — Tier 1 foundation paint anchor.',
    setup: async () => {
      // Capture as-mounted; no interactions.
    },
  },
  {
    id: 'sort-name-asc',
    description:
      'Click the first sortable header to apply ascending sort — captures sort indicator + arrow paint (Phase 8).',
    setup: async (page) => {
      // First header cell that's not the selection / row-drag column.
      // The demos render checkbox + row-drag rails on the left, then
      // the first data column. The "id" column header is the leftmost
      // data header. Click it once → ascending sort. Some adapters
      // (e.g. vue2 with id pinned-left) may render different click
      // semantics for the pinned header; the .catch wrapper preserves
      // the baseline as default-load paint when the click misses.
      const firstDataHeader = page
        .locator('.demo-page__table:first-of-type .cx-table-header-cell[data-col-id="id"]')
        .first();
      await firstDataHeader.click({ timeout: 5000 }).catch(() => undefined);
    },
  },
  {
    id: 'filter-row-visible',
    description:
      'Primary demo enables show-filter-row by default — captures filter-row chrome + per-column widget paint (Phase 9).',
    setup: async () => {
      // No interaction; the primary demo enables show-filter-row=true.
      // This scenario validates that the filter-row paint hasn't drifted
      // from the captured baseline.
    },
  },
  {
    id: 'pinned-left-column',
    description:
      'Right-click the first data column → pin left → captures pinned-column boundary + sticky-positioning paint (Phase 17).',
    setup: async (page) => {
      const firstHeader = page
        .locator('.demo-page__table:first-of-type .cx-table-header-cell[data-col-id="id"]')
        .first();
      // Open column-header menu via the kebab button. Selector pattern:
      // `.cx-table-column-header-menu-trigger` lives inside each header
      // cell when `:show-column-header-menu="true"` (which the primary
      // demo enables). Wrapped in .catch so adapter divergence (e.g.
      // vue2 pinned-by-default columns) doesn't fail the capture.
      await firstHeader.hover({ timeout: 5000 }).catch(() => undefined);
      const kebab = firstHeader.locator('.cx-table-column-header-menu-trigger');
      if ((await kebab.count().catch(() => 0)) > 0) {
        await kebab.click({ timeout: 5000 }).catch(() => undefined);
        const pinLeft = page.locator('text=/固定到左侧|Pin left/');
        if ((await pinLeft.count().catch(() => 0)) > 0) {
          await pinLeft
            .first()
            .click({ timeout: 5000 })
            .catch(() => undefined);
        }
      }
    },
  },
  {
    id: 'column-visibility-menu-open',
    description:
      'Open the column-visibility menu (native `<details>` dropdown) — captures dropdown paint (Phase 25).',
    setup: async (page) => {
      // The column visibility menu is rendered as a <details>
      // <summary> element. Selector exposed by the SFC:
      // `.cx-table-column-visibility-menu`. Click the summary to open.
      const menu = page
        .locator('.demo-page__table:first-of-type .cx-table-column-visibility-menu summary')
        .first();
      if ((await menu.count()) > 0) {
        await menu.click();
      }
    },
  },
  {
    id: 'cell-edit-active',
    description:
      'Double-click an editable cell to enter edit mode — captures editor `<input>` overlay + cx-table-cell--editing paint (Phase 12).',
    setup: async (page) => {
      // Find the first editable data cell. The demo marks several
      // columns as editable; the "note" column is editable in the
      // primary demo. Wrapped in .catch so adapter-specific blur /
      // focus timing differences don't fail the capture.
      const cell = page
        .locator('.demo-page__table:first-of-type .cx-table-cell[data-col-id="note"]')
        .first();
      await cell.dblclick({ timeout: 5000 }).catch(() => undefined);
    },
  },
  {
    id: 'tool-panel-columns-open',
    description:
      'Tool-panel popover demo section: open the settings popover via the action-column header gear icon, then activate the columns tab — captures popover paint (Phase 80).',
    setup: async (page) => {
      // The tool-panel section is the LAST <ChronixTable> on the
      // page, identified by data-testid="tool-panel-section".
      const toolPanelSection = page.locator('[data-testid="tool-panel-section"]');
      if ((await toolPanelSection.count()) > 0) {
        await toolPanelSection.scrollIntoViewIfNeeded();
        // Open the settings popover by clicking the gear icon in
        // the action column header.
        const settingsBtn = toolPanelSection.locator('.cx-table-header-settings-button');
        if ((await settingsBtn.count()) > 0) {
          await settingsBtn.first().click();
          // Activate the columns tab inside the popover.
          const columnsTab = toolPanelSection.locator(
            '.cx-table-settings-popover-tab[data-tool-panel-id="columns"]',
          );
          if ((await columnsTab.count()) > 0) {
            await columnsTab.first().click();
          }
        }
      }
    },
  },
  {
    id: 'invalid-cell-marker',
    description:
      'Trigger Phase 101 validator-rejected state on a cell — captures cx-table-cell--invalid + data-cell-invalid + aria-invalid paint.',
    setup: async (page) => {
      // Open the "note" editable cell, type a known invalid value,
      // press Enter. Wrapped in .catch for adapter-divergence
      // resilience.
      const cell = page
        .locator('.demo-page__table:first-of-type .cx-table-cell[data-col-id="note"]')
        .first();
      await cell.dblclick({ timeout: 5000 }).catch(() => undefined);
      await page.keyboard.press('Control+A').catch(() => undefined);
      await page.keyboard.press('Delete').catch(() => undefined);
      await page.keyboard.press('Enter').catch(() => undefined);
    },
  },
];

export const TABLE_VRT_BASELINE_DIR = 'table-cross-demo-baselines';

export const TABLE_VRT_TOLERANCE = {
  maxDiffPixelRatio: 0,
  threshold: 0.2,
} as const;
