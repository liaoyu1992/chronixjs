import {
  createDefaultUIContext,
  cssVarsForUITheme,
  mergeUIContext,
  type ChronixUIContext,
  type ChronixUIContextOverrides,
} from '@chronixjs/ui';
import { createContext, useContext, useMemo, type CSSProperties, type ReactNode } from 'react';

/**
 * React `Context` holding the resolved `ChronixUIContext`. Consumers
 * read via the `useUIContext()` hook; the raw `Context` is exported
 * so consumers wanting to use `React.useContext(UIContext)` directly
 * (e.g. inside a `useSyncExternalStore` setup) can.
 *
 * per Decision A.1 + B.1. React's
 * `Context` already handles reactivity, so the value is the plain
 * `ChronixUIContext` (not a ref/state wrapper) — Decision B.1 says
 * the return shape is adapter-native.
 */
export const UIContext = createContext<ChronixUIContext | null>(null);

/**
 * Props for `<ChronixUIProvider>`. Mirrors the Vue 3 + Vue 2 surface.
 * Every field optional — when no parent provider is present, defaults
 * from `createDefaultUIContext()` apply.
 */
export interface ChronixUIProviderProps extends ChronixUIContextOverrides {
  readonly children?: ReactNode;
}

/**
 * `<ChronixUIProvider>` — React root provider that propagates a
 * `ChronixUIContext` to every descendant via `React.Context`. Nested
 * providers compose via `mergeUIContext` so each scope can override
 * pieces of its ancestor's config.
 *
 * Writes the theme tokens as CSS custom properties on its own root
 * `<div>` element via inline `style` so descendant component CSS can
 * read tokens via `var(--cx-ui-...)` fallback. Same DOM shape as
 * `adapters/ui-vue3` + `adapters/ui-vue2` (`.cx-ui-provider` root with
 * inline-style CSS vars) so cross-adapter Playwright parity is
 * structural-by-construction.
 *
 * .
 */
export function ChronixUIProvider(props: ChronixUIProviderProps): React.ReactElement {
  const parent = useContext(UIContext);
  const overrides = useMemo(
    (): ChronixUIContextOverrides => collectOverrides(props),
    // The merge re-runs only when the actual override fields change.
    // We list each field explicitly so a re-render with the same prop
    // values is a no-op (matches Vue's reactivity guarantee).
    [
      props.theme,
      props.locale,
      props.size,
      props.clsPrefix,
      props.disabled,
      props.portalContainer,
      props.rtl,
      props.componentOverrides,
    ],
  );
  const merged = useMemo(
    () => mergeUIContext(parent ?? createDefaultUIContext(), overrides),
    [parent, overrides],
  );
  const rootStyle = useMemo<CSSProperties>(() => cssVarsForUITheme(merged.theme), [merged.theme]);

  return (
    <UIContext.Provider value={merged}>
      <div
        className="cx-ui-provider"
        style={rootStyle}
        {...(merged.rtl ? { dir: 'rtl' as const } : {})}
      >
        {props.children}
      </div>
    </UIContext.Provider>
  );
}

/**
 * Strip `undefined` entries from the props bag so `mergeUIContext`'s
 * "shallow ??" semantics preserve parent values for omitted props —
 * mirrors the Vue 3 + Vue 2 providers' `buildOverrides` helper.
 */
function collectOverrides(props: ChronixUIProviderProps): ChronixUIContextOverrides {
  const out: Record<string, unknown> = {};
  if (props.theme !== undefined) out['theme'] = props.theme;
  if (props.locale !== undefined) out['locale'] = props.locale;
  if (props.size !== undefined) out['size'] = props.size;
  if (props.clsPrefix !== undefined) out['clsPrefix'] = props.clsPrefix;
  if (props.disabled !== undefined) out['disabled'] = props.disabled;
  if (props.portalContainer !== undefined) out['portalContainer'] = props.portalContainer;
  if (props.rtl !== undefined) out['rtl'] = props.rtl;
  if (props.componentOverrides !== undefined) out['componentOverrides'] = props.componentOverrides;
  return out;
}
