/**
 * Option IR — . Pure-data types used by Select,
 * TreeSelect, Cascader, Mention, and any future option-bearing
 * component. chronix-NEW surface.
 *
 * Conventions:
 * - Every `OptionSpec` has a `key: string` (stable identity for
 *   list-keying + keyboard nav) AND a `value: string` (emitted on
 *   select).
 * - Groups are discriminated via `kind: 'group'`; their children must
 *   be flat `OptionSpec[]` (no nested groups in v0.1.0-alpha).
 * - All helpers are PURE: they return new arrays or the input
 *   reference when no work is needed (fast-path).
 */

export interface OptionSpec {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly disabled?: boolean;
  /** IconRegistry name. */
  readonly icon?: string | undefined;
}

export interface OptionGroupSpec {
  readonly kind: 'group';
  readonly key: string;
  readonly label: string;
  readonly children: readonly OptionSpec[];
}

/**
 * A list item is either a flat option or a group container. Select
 * accepts `OptionListItem[]`; Cascader / Mention accept plain
 * `OptionSpec[]` (no groups).
 */
export type OptionListItem = OptionSpec | OptionGroupSpec;

export function isOptionGroup(item: OptionListItem): item is OptionGroupSpec {
  return (item as OptionGroupSpec).kind === 'group';
}
