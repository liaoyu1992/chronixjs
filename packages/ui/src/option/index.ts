/**
 * chronix-ui option module — Phase 31 (2026-06-04).
 *
 * Framework-agnostic Option IR used by Select, TreeSelect (partial —
 * Tree IR drives its panel), Cascader (flat-only, plus its own
 * recursive shape), Mention, and any future option-bearing component.
 *
 * Public surface:
 * - `OptionSpec` / `OptionGroupSpec` / `OptionListItem` types +
 *   `isOptionGroup` predicate.
 * - `filterOptions` — case-insensitive substring filter with
 *   group-ancestry preservation.
 * - `matchOptionPattern` — highlight char-range computation.
 * - `getActivatableOptionKeys` — keyboard-nav candidate keys.
 * - `findOptionByKey` / `findOptionByValue` — leaf-option lookups.
 */
export type { OptionGroupSpec, OptionListItem, OptionSpec } from './option-spec.js';
export { isOptionGroup } from './option-spec.js';
export { filterOptions } from './filter-options.js';
export type { MatchSpan } from './match-option-pattern.js';
export { matchOptionPattern } from './match-option-pattern.js';
export { getActivatableOptionKeys } from './get-activatable-option-keys.js';
export { findOptionByKey, findOptionByValue } from './find-option-by-key.js';
