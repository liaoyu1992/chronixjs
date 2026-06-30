/**
 * LoadingBar IR — . Imperative loading bar API.
 *
 * A thin bar fixed at the top of the viewport that indicates loading
 * progress. The bar transitions through 4 states: idle, loading,
 * finishing, and error. Core IR ships the pure-data types, class-list
 * helper, and CSS.
 *
 * Public surface:
 *
 * - **`LoadingBarState`** — `'idle' | 'loading' | 'finishing' | 'error'`.
 */

/** Loading bar state machine. */
export type LoadingBarState = 'idle' | 'loading' | 'finishing' | 'error';
