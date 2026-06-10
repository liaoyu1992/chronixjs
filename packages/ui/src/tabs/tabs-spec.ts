/**
 * Tabs component IR — Phase 28 (2026-06-04). Tier B items-array tabs
 * mirroring the Phase 25 Radio / Phase 27 Menu + Dropdown precedent.
 *
 * Out-of-scope (v0.2):
 * - Lazy mount (currently active-only render).
 * - Rich content (sub-component variant).
 * - Animated indicator sliding.
 * - Scroll buttons when tabs overflow.
 */

/**
 * Visual variant. Drives the `--type-line` / `--type-card` /
 * `--type-segment` modifier class. CSS handles the visual treatment;
 * no per-type prop branching at the IR layer.
 */
export type TabsType = 'line' | 'card' | 'segment';

/**
 * Tab-bar position relative to the content panel. Drives the
 * `--placement-{top,right,bottom,left}` modifier. Adapter chooses
 * arrow-key direction based on horizontal vs vertical placement.
 */
export type TabsPlacement = 'top' | 'right' | 'bottom' | 'left';

/**
 * Size modifier. Drives padding + font size.
 */
export type TabsSize = 'small' | 'medium' | 'large';

export interface TabItem {
  readonly key: string;
  readonly label: string;
  /** When `true`, tab is unclickable + skipped by keyboard nav. */
  readonly disabled: boolean;
  /**
   * Plain-text content of the panel for this tab. `undefined` ships an
   * empty panel. Rich-content variant deferred to v0.2.
   */
  readonly content: string | undefined;
  /** When `true`, a close button is rendered on this tab. */
  readonly closable?: boolean;
}

export interface TabsProps {
  /** Currently active tab key. `undefined` = no tab active. */
  readonly value: string | undefined;
  readonly items: readonly TabItem[];
  readonly type: TabsType;
  readonly placement: TabsPlacement;
  readonly size: TabsSize;
  /** When `true`, entire tabs component is disabled. */
  readonly disabled: boolean;
  /** When `true`, renders an "add" button at the end of the tab bar. */
  readonly addable: boolean;
  /** When `true`, tabs can be reordered via drag-and-drop. */
  readonly draggable: boolean;
}

export const defaultTabsProps: TabsProps = {
  value: undefined,
  items: [],
  type: 'line',
  placement: 'top',
  size: 'medium',
  disabled: false,
  addable: false,
  draggable: false,
};

/**
 * Convenience: enumerate keys that the adapter's keyboard-nav helper
 * should treat as activatable (skips disabled).
 */
export function getActivatableTabKeys(items: readonly TabItem[]): readonly string[] {
  return items.filter((item) => !item.disabled).map((item) => item.key);
}

/**
 * Find a tab item by key, or `undefined` when not found. Pure helper.
 */
export function findTabItemByKey(items: readonly TabItem[], key: string): TabItem | undefined {
  return items.find((item) => item.key === key);
}

/**
 * Whether the chosen placement uses vertical keyboard navigation
 * (ArrowUp / ArrowDown). `'left'` and `'right'` are vertical; `'top'`
 * and `'bottom'` are horizontal (ArrowLeft / ArrowRight).
 */
export function tabsUsesVerticalKeyboardNav(placement: TabsPlacement): boolean {
  return placement === 'left' || placement === 'right';
}

/**
 * Reorder tab items by moving `sourceKey` to the position immediately
 * after `targetKey`. Returns the original array when:
 * - sourceKey === targetKey (no-op)
 * - either key is absent from the items array
 *
 * Pure helper — does not mutate the input.
 */
export function reorderTabItems(
  items: readonly TabItem[],
  sourceKey: string,
  targetKey: string,
): readonly TabItem[] {
  if (sourceKey === targetKey) return items;
  const sourceIdx = items.findIndex((item) => item.key === sourceKey);
  const targetIdx = items.findIndex((item) => item.key === targetKey);
  if (sourceIdx === -1 || targetIdx === -1) return items;
  const result = items.filter((item) => item.key !== sourceKey);
  const insertIdx = result.findIndex((item) => item.key === targetKey) + 1;
  const sourceItem = items[sourceIdx]!;
  result.splice(insertIdx, 0, sourceItem);
  return result;
}
