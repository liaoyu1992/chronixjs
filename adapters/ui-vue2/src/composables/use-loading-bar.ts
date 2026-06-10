import {
  type LoadingBarState,
  ensureChronixLoadingBarStyles,
  resolveLoadingBarClassList,
} from '@chronixjs/ui';
import { ref, type Ref } from 'vue';

/**
 * Vue 2.7 imperative Loading Bar composable — Phase 36 (2026-06-05).
 * Verbatim port of `adapters/ui-vue3`'s `useLoadingBar()`.
 *
 * Usage:
 * ```ts
 * const loadingBar = useLoadingBar();
 * loadingBar.start();
 * // ... async work ...
 * loadingBar.finish();
 * ```
 */

export interface LoadingBarApi {
  readonly state: Ref<LoadingBarState>;
  readonly classList: Ref<readonly string[]>;
  start(): void;
  finish(): void;
  error(): void;
}

export function useLoadingBar(): LoadingBarApi {
  ensureChronixLoadingBarStyles();

  const state = ref<LoadingBarState>('idle');
  const classList = ref<readonly string[]>(resolveLoadingBarClassList({ state: 'idle' }));

  function updateClasses(): void {
    classList.value = resolveLoadingBarClassList({ state: state.value });
  }

  function start(): void {
    state.value = 'loading';
    updateClasses();
  }

  function finish(): void {
    state.value = 'finishing';
    updateClasses();
    // After the CSS transition completes, go back to idle.
    setTimeout(() => {
      state.value = 'idle';
      updateClasses();
    }, 350);
  }

  function error(): void {
    state.value = 'error';
    updateClasses();
    // After the CSS transition completes, go back to idle.
    setTimeout(() => {
      state.value = 'idle';
      updateClasses();
    }, 350);
  }

  return { state, classList, start, finish, error };
}
