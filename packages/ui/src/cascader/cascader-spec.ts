/**
 * Cascader component IR — Phase 31 (2026-06-04).
 *
 * Multi-level cascading selector. Each level is an option list.
 * Options are nested `OptionSpec` with `children` for sub-levels.
 */

import { isOptionGroup, type SelectOption } from '../select/option-spec.js';

import type { PopupPlacement } from '../popup/popup-spec.js';

export interface CascaderProps {
  /** Selected leaf key(s). Single string or string[] when multiple. */
  readonly value: string | readonly string[] | undefined;
  /** Nested options. `children` = sub-level. */
  readonly options: readonly SelectOption[];
  readonly multiple: boolean;
  readonly clearable: boolean;
  readonly placeholder: string;
  readonly disabled: boolean;
  readonly placement: PopupPlacement;
}

export const defaultCascaderProps: CascaderProps = {
  value: undefined,
  options: [],
  multiple: false,
  clearable: false,
  placeholder: '',
  disabled: false,
  placement: 'bottom-start',
};

/**
 * One panel in the cascader dropdown. Computed from `options` + `activePath`.
 */
export interface CascaderPanel {
  /** Options to display in this panel. */
  readonly options: readonly SelectOption[];
  /** Index of this panel (0 = root). */
  readonly level: number;
}

/**
 * Compute the active path labels for display in the trigger.
 * Walks from root options through selected keys to build the path.
 */
export function resolveCascaderPathLabels(
  options: readonly SelectOption[],
  leafKey: string,
): string[] {
  const labels: string[] = [];
  function walk(opts: readonly SelectOption[], target: string): boolean {
    for (const opt of opts) {
      if (opt.key === target) {
        labels.push(opt.label);
        return true;
      }
      if (isOptionGroup(opt)) {
        labels.push(opt.label);
        if (walk(opt.children, target)) return true;
        labels.pop();
      }
    }
    return false;
  }
  walk(options, leafKey);
  return labels;
}
