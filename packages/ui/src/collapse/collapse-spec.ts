/**
 * Collapse component IR — . Tier B
 * accordion / multi-expand panel list. Each item's body is wrapped in
 * a `<ChronixCollapseTransition>` for height animation.
 *
 * The `accordion` prop switches the `value` shape from
 * `readonly string[]` (multi) to `string` (single). For v0.1.0-alpha
 * we ship the union `string | readonly string[] | undefined` and
 * normalize via `normalizeCollapseValue` at adapter scope.
 *
 * Out-of-scope (v0.2):
 * - Custom expand icon.
 * - Nested collapse.
 * - Ghost variant (no border).
 */

export interface CollapseItem {
  readonly key: string;
  readonly title: string;
  /** Plain-text panel body. Rich content deferred to v0.2 slot variant. */
  readonly content: string | undefined;
  readonly disabled: boolean;
}

export type CollapseArrowPlacement = 'left' | 'right';

export interface CollapseProps {
  /**
   * Currently expanded key(s). When `accordion: true`, treat as `string`
   * (single key); when `accordion: false`, treat as `readonly string[]`
   * (multiple keys). `undefined` = nothing expanded.
   *
   * Adapters typically normalize via `normalizeCollapseValue` and emit
   * in the matching shape via `update:value`.
   */
  readonly value: string | readonly string[] | undefined;
  readonly items: readonly CollapseItem[];
  /** When `true`, only one item can be expanded at a time. */
  readonly accordion: boolean;
  /** Side the chevron arrow renders on. */
  readonly arrowPlacement: CollapseArrowPlacement;
}

export const defaultCollapseProps: CollapseProps = {
  value: undefined,
  items: [],
  accordion: false,
  arrowPlacement: 'left',
};

/**
 * Normalize the union-typed `value` prop to a `ReadonlySet<string>` of
 * currently-expanded keys. Pure helper consumed by all 3 adapters.
 *
 * Behavior:
 * - `undefined` → empty set.
 * - `string` → singleton set with that key.
 * - `readonly string[]` → set of all keys.
 *
 * `accordion` is informational — the normalization is the same either
 * way; the adapter uses `accordion` to decide whether the emitted
 * value is a string (last expanded key) or an array.
 */
export function normalizeCollapseValue(
  value: string | readonly string[] | undefined,
  _accordion: boolean,
): ReadonlySet<string> {
  if (value === undefined) return new Set();
  if (typeof value === 'string') return new Set([value]);
  return new Set(value);
}

/**
 * Compute the next `value` after a toggle action. Pure helper.
 *
 * When `accordion: true`, toggling a key replaces the value (or
 * clears it when toggling the currently-expanded key). When
 * `accordion: false`, toggling a key adds/removes it from the array
 * — and the result is sorted by the input items order for stability.
 */
export function toggleCollapseValue(input: {
  readonly currentExpanded: ReadonlySet<string>;
  readonly toggleKey: string;
  readonly accordion: boolean;
  readonly items: readonly CollapseItem[];
}): string | readonly string[] | undefined {
  const { currentExpanded, toggleKey, accordion, items } = input;
  const isExpanded = currentExpanded.has(toggleKey);
  if (accordion) {
    if (isExpanded) return undefined;
    return toggleKey;
  }
  const next = new Set(currentExpanded);
  if (isExpanded) {
    next.delete(toggleKey);
  } else {
    next.add(toggleKey);
  }
  return items.map((item) => item.key).filter((key) => next.has(key));
}

/**
 * Whether the given item key is currently expanded. Pure helper.
 */
export function isCollapseItemExpanded(input: {
  readonly value: string | readonly string[] | undefined;
  readonly itemKey: string;
}): boolean {
  if (input.value === undefined) return false;
  if (typeof input.value === 'string') return input.value === input.itemKey;
  return input.value.includes(input.itemKey);
}
