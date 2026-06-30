/**
 * chronix-ui context module — .
 *
 * Pure-data interface for app-wide configuration propagation. Adapters
 * (`@chronixjs/ui-vue3`, `@chronixjs/ui-vue2`, `@chronixjs/ui-react`)
 * wrap the interface with their native context primitive; the core has
 * no framework dependency.
 *
 * Public surface:
 *
 * - `ChronixUIContext` — pure-data app-wide config (Decision A.1).
 * - `ChronixUIContextOverrides` — partial overlay for `mergeUIContext`.
 * - `ChronixUIComponentOverrides` — per-component default-prop bag.
 * - `createDefaultUIContext()` — factory producing baseline context.
 * - `mergeUIContext(parent, overrides)` — deep-merge helper composing
 *   `mergeChronixUITheme` for the theme slice.
 */

export type {
  ChronixUIComponentOverrides,
  ChronixUIContext,
  ChronixUIContextOverrides,
} from './chronix-ui-context.js';
export { createDefaultUIContext } from './create-default-ui-context.js';
export { mergeUIContext } from './merge-ui-context.js';
