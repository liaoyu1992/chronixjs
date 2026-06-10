/**
 * Dropdown component IR — Phase 27 (2026-06-03). Tier B popup-style
 * trigger that opens a flat list of options with keyboard navigation.
 *
 * Consumes Phase 26 `usePopupLifecycle` (anchor + portal + trigger +
 * click-outside + Escape) at adapter scope. Adds Phase 7
 * `composeKeyboardSelection` for ArrowUp/Down navigation + Enter to
 * select.
 *
 * Out-of-scope for v0.1.0-alpha (see design doc):
 * - Divider items.
 * - Sub-dropdown nesting.
 * - Async loading.
 * - Render-prop custom rendering.
 * - Grouped options under headers.
 */

import type { PopupPlacement } from '../popup/popup-spec.js';
import type { PopupTrigger } from '../popup/trigger-spec.js';

export interface DropdownOption {
  /** Stable identity for adapter list-keying + keyboard nav. */
  readonly key: string;
  readonly label: string;
  /** Value emitted on `select` — typically distinct from the React-stable `key`. */
  readonly value: string;
  readonly disabled: boolean;
  /** Phase 9 IconRegistry name; `undefined` = no icon. */
  readonly icon: string | undefined;
}

export interface DropdownProps {
  readonly show: boolean | undefined;
  readonly trigger: PopupTrigger;
  readonly placement: PopupPlacement;
  readonly options: readonly DropdownOption[];
  readonly disabled: boolean;
}

export const defaultDropdownProps: DropdownProps = {
  show: undefined,
  trigger: 'click',
  placement: 'bottom-start',
  options: [],
  disabled: false,
};

/**
 * Filter the options array down to the non-disabled keys — used by
 * adapter keyboard nav to know which keys ArrowUp/Down can land on.
 * Pure helper; returns `key`s in input order.
 */
export function getDropdownActivatableKeys(options: readonly DropdownOption[]): readonly string[] {
  return options.filter((o) => !o.disabled).map((o) => o.key);
}

/**
 * Look up a single option by key. Returns `null` when no match (e.g.
 * `activeKey` references a stale snapshot after options changed).
 */
export function findDropdownOptionByKey(
  options: readonly DropdownOption[],
  key: string | null,
): DropdownOption | null {
  if (key === null) return null;
  return options.find((o) => o.key === key) ?? null;
}
