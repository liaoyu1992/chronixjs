/**
 * Transfer list computation — .
 *
 * Pure helpers to split options into source/target panels,
 * filter by search pattern, and compute bulk-action sets.
 */

import type { TransferOption } from './transfer-spec.js';

/**
 * Split options into source (unselected) and target (selected) lists.
 * Preserves the original order of options.
 */
export function computeTransferLists(
  options: readonly TransferOption[],
  value: readonly (string | number)[],
): { source: TransferOption[]; target: TransferOption[] } {
  const valueSet = new Set(value);
  const source: TransferOption[] = [];
  const target: TransferOption[] = [];

  // Target list preserves the order of `value`
  const targetMap = new Map<string | number, TransferOption>();
  for (const opt of options) {
    targetMap.set(opt.value, opt);
  }
  for (const v of value) {
    const opt = targetMap.get(v);
    if (opt != null) target.push(opt);
  }

  // Source list = options NOT in value, preserving original order
  for (const opt of options) {
    if (!valueSet.has(opt.value)) source.push(opt);
  }

  return { source, target };
}

/**
 * Filter options by search pattern. Case-insensitive substring match
 * on the label.
 */
export function filterTransferOptions(
  options: readonly TransferOption[],
  pattern: string,
): TransferOption[] {
  if (!pattern) return [...options];
  const lower = pattern.toLowerCase();
  return options.filter((opt) => opt.label.toLowerCase().includes(lower));
}

export type TransferBulkAction = 'check-all' | 'uncheck-all' | 'clear';

/**
 * Compute the resulting value after a bulk action.
 *
 * - `check-all`: add all non-disabled source options to target
 * - `uncheck-all`: remove all non-disabled source options from target
 * - `clear`: remove all target options (reset to empty)
 */
export function computeTransferBulkValue(
  action: TransferBulkAction,
  currentValue: readonly (string | number)[],
  options: readonly TransferOption[],
): (string | number)[] {
  switch (action) {
    case 'check-all': {
      const existing = new Set(currentValue);
      const toAdd = options.filter((o) => !o.disabled && !existing.has(o.value));
      return [...currentValue, ...toAdd.map((o) => o.value)];
    }
    case 'uncheck-all': {
      const removable = new Set(options.filter((o) => !o.disabled).map((o) => o.value));
      return currentValue.filter((v) => !removable.has(v));
    }
    case 'clear':
      return [];
  }
}
