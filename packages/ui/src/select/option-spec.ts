/**
 * Select-family shared option IR — .
 *
 * Shared by Select / TreeSelect / Cascader / Mention. Array-only
 * authoring per precedent.
 *
 * `OptionSpec` — leaf option (no children).
 * `OptionGroupSpec` — grouping container (children = nested options or
 *   further groups). Groups are rendered as non-interactive labels
 *   in Select / Cascader / Mention dropdowns.
 * `SelectOption` — union type accepted by all 4 components' `options`
 *   prop. Recursively nestable for Cascader multi-level panels.
 */

export interface OptionSpec {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly disabled?: boolean;
  /** Leaf option — `children` is `undefined`. */
  readonly children?: undefined;
}

export interface OptionGroupSpec {
  readonly key: string;
  readonly label: string;
  readonly disabled?: boolean;
  /** Group children — may contain further groups for Cascader. */
  readonly children: readonly (OptionSpec | OptionGroupSpec)[];
}

export type SelectOption = OptionSpec | OptionGroupSpec;

/** Type guard: returns `true` for `OptionGroupSpec`. */
export function isOptionGroup(option: SelectOption): option is OptionGroupSpec {
  return Array.isArray((option as OptionGroupSpec).children);
}
