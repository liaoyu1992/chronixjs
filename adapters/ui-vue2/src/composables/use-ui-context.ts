import { createDefaultUIContext, type ChronixUIContext } from '@chronixjs/ui';
import { inject, shallowRef, type Ref } from 'vue';

import { UI_CONTEXT_INJECTION_KEY } from '../providers/chronix-ui-provider.js';

/**
 * Vue 2.7 composable returning the active `ChronixUIContext` as a `Ref`.
 *
 * per Decision B.1. Verbatim port of
 * `adapters/ui-vue3`'s `useUIContext()` — Vue 2.7's Composition API
 * `inject` + `Ref` types share the same surface as Vue 3.
 *
 * Resolution order:
 *
 * 1. If a parent `<ChronixUIProvider>` is present, returns its merged
 *    context ref (reactive — updates propagate when the provider's
 *    props change).
 * 2. Otherwise returns a fresh `shallowRef(createDefaultUIContext())`
 *    so consumers can use components without explicitly mounting a
 *    provider (defaults apply). The returned ref's value never
 *    changes in this fallback path.
 */
export function useUIContext(): Ref<ChronixUIContext> {
  const injected = inject<Ref<ChronixUIContext> | null>(UI_CONTEXT_INJECTION_KEY, null);
  if (injected) return injected;
  return shallowRef(createDefaultUIContext());
}
