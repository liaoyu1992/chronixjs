import { defaultEnUSLocale } from '../locale/chronix-locale.js';
import { defaultChronixUITheme } from '../theme/chronix-ui-theme.js';

import type { ChronixUIContext } from './chronix-ui-context.js';

/**
 * Produce a baseline `ChronixUIContext` with framework-agnostic defaults.
 *
 * Phase 2 (2026-06-01) per Phase 0.3 Decision A.1.
 *
 * Used by the adapter `<ChronixUIProvider>` when no parent provider is
 * mounted (the root provider's "parent" is the default). Also used by
 * library code (e.g. validation helpers) that need a context to call
 * into but isn't running under a real provider — e.g. unit tests, SSR
 * snapshot tests, programmatic theme/locale resolution.
 *
 * Defaults:
 *
 * - `theme`: `defaultChronixUITheme` (light preset).
 * - `locale`: `defaultEnUSLocale` (`{ name: 'en-US' }` stub; Phase 3
 *   extends with message keys).
 * - `size`: `'medium'`.
 * - `clsPrefix`: `'cx-ui'` — informational only in v0.1.0 (per Phase 0.3
 *   Decision C.1).
 * - `disabled`: `false`.
 * - `portalContainer`: `'body'` — the standard portal mount target.
 * - `rtl`: `false`.
 * - `componentOverrides`: `{}` — no component-level prop defaults.
 *
 * Each call returns a NEW object so callers can safely mutate the
 * returned value (e.g. in test setup) without affecting other callers.
 * Adapters that propagate context reactively should treat this factory
 * as a fallback, not a singleton.
 */
export function createDefaultUIContext(): ChronixUIContext {
  return {
    theme: defaultChronixUITheme,
    locale: defaultEnUSLocale,
    size: 'medium',
    clsPrefix: 'cx-ui',
    disabled: false,
    portalContainer: 'body',
    rtl: false,
    componentOverrides: {},
  };
}
