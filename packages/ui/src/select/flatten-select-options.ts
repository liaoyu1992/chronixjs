/**
 * Flatten nested Select options — Phase 31 (2026-06-04).
 *
 * Recursively flattens `SelectOption[]` (potentially nested groups)
 * into a flat `FlatOptionEntry[]` suitable for rendering as a list
 * and for keyboard navigation. Groups are emitted as non-interactive
 * entries; leaf options carry their depth for indentation.
 */

import { isOptionGroup } from './option-spec.js';

import type { OptionSpec, OptionGroupSpec, SelectOption } from './option-spec.js';

export interface FlatOptionEntry {
  /** The original option or group spec. */
  readonly option: OptionSpec | OptionGroupSpec;
  /** Nesting depth (0 = root). Used for indentation. */
  readonly depth: number;
  /** `true` for OptionGroupSpec (non-interactive group label). */
  readonly isGroup: boolean;
}

/**
 * Recursively flatten `SelectOption[]` into `FlatOptionEntry[]`.
 *
 * Pre-order traversal (group label first, then its children).
 * Respects group nesting for Cascader multi-level panels.
 */
export function flattenSelectOptions(options: readonly SelectOption[]): readonly FlatOptionEntry[] {
  const out: FlatOptionEntry[] = [];
  flattenRecursive(options, 0, out);
  return out;
}

function flattenRecursive(
  options: readonly SelectOption[],
  depth: number,
  out: FlatOptionEntry[],
): void {
  for (const option of options) {
    if (isOptionGroup(option)) {
      out.push({ option, depth, isGroup: true });
      flattenRecursive(option.children, depth + 1, out);
    } else {
      out.push({ option, depth, isGroup: false });
    }
  }
}
