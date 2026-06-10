import {
  type LoadingBarState,
  ensureChronixLoadingBarStyles,
  resolveLoadingBarClassList,
} from '@chronixjs/ui';
import { useCallback, useMemo, useState } from 'react';

/**
 * React imperative Loading Bar hook — Phase 36 (2026-06-05).
 * Same surface as Vue 3 / Vue 2 `useLoadingBar()` composables.
 *
 * Usage:
 * ```tsx
 * const loadingBar = useLoadingBar();
 * loadingBar.start();
 * // ... async work ...
 * loadingBar.finish();
 * ```
 */

export interface LoadingBarApi {
  readonly state: LoadingBarState;
  readonly classList: readonly string[];
  start(): void;
  finish(): void;
  error(): void;
}

export function useLoadingBar(): LoadingBarApi {
  ensureChronixLoadingBarStyles();

  const [state, setState] = useState<LoadingBarState>('idle');

  const start = useCallback(() => {
    setState('loading');
  }, []);

  const finish = useCallback(() => {
    setState('finishing');
    setTimeout(() => setState('idle'), 350);
  }, []);

  const error = useCallback(() => {
    setState('error');
    setTimeout(() => setState('idle'), 350);
  }, []);

  const classList = useMemo<readonly string[]>(
    () => resolveLoadingBarClassList({ state }),
    [state],
  );

  return { state, classList, start, finish, error };
}
