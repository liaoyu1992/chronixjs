import { createDefaultUIContext, type ChronixUIContext } from '@chronixjs/ui';
import { inject, shallowRef, type Ref } from 'vue';

import { UI_CONTEXT_INJECTION_KEY } from '../providers/chronix-ui-provider.js';

/**
 * Vue 3 composable returning the active `ChronixUIContext` as a `Ref`.
 *
 * per Decision B.1.
 *
 * Resolution order:
 *
 * 1. If a parent `<ChronixUIProvider>` is present, returns its merged
 *    context ref (reactive — updates propagate when the provider's
 *    props change).
 * 2. Otherwise returns a fresh `shallowRef(createDefaultUIContext())`
 *    so consumers can still use components without explicitly mounting
 *    a provider (defaults apply). The returned ref's value never
 *    changes in this fallback path — components reading it see stable
 *    defaults.
 */
export function useUIContext(): Ref<ChronixUIContext> {
  const injected = inject<Ref<ChronixUIContext> | null>(UI_CONTEXT_INJECTION_KEY, null);
  if (injected) return injected;
  return shallowRef(createDefaultUIContext());
}
