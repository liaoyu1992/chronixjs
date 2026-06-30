import { createDefaultUIContext, type ChronixUIContext } from '@chronixjs/ui';
import { useContext, useMemo } from 'react';

import { UIContext } from '../providers/chronix-ui-provider.js';

/**
 * React hook returning the active `ChronixUIContext` value.
 *
 * per Decision B.1. Unlike the Vue
 * adapters' `useUIContext()` which returns a `Ref<ChronixUIContext>`
 * (so Vue's reactivity machinery can track reads), the React hook
 * returns the plain `ChronixUIContext` value because React Context
 * already drives re-renders on value change. This adapter-native
 * return shape is exactly what Decision B.1 prescribes.
 *
 * Resolution order:
 *
 * 1. If a parent `<ChronixUIProvider>` is mounted, returns its merged
 *    context value.
 * 2. Otherwise returns a default context (memoized once per hook
 *    instance so referential equality holds across re-renders).
 */
export function useUIContext(): ChronixUIContext {
  const ctx = useContext(UIContext);
  // Memoize the fallback so two consecutive `useUIContext()` calls
  // in the same component return referentially-equal objects when no
  // provider is mounted (matches the Vue adapters' stable-default
  // behavior).
  const fallback = useMemo(() => createDefaultUIContext(), []);
  return ctx ?? fallback;
}
