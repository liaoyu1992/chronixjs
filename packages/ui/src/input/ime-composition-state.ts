/**
 * IME (Input Method Editor) composition-state tracker. Used by text-input
 * adapters to gate side effects (search triggers, validation, controlled
 * value commits) during multi-keystroke composition for CJK / Korean /
 * Vietnamese / etc. languages.
 *
 * Phase 7 (2026-06-02).
 *
 * Lifecycle:
 *
 * 1. Browser fires `compositionstart` when the user begins typing via
 *    IME → adapter calls `withCompositionStart`.
 * 2. Browser fires `compositionupdate` with partial composition text →
 *    adapter calls `withCompositionUpdate(state, event.data)`.
 * 3. Browser fires `compositionend` when the user confirms a candidate →
 *    adapter calls `withCompositionEnd(state, event.data)`. The final
 *    text is now reflected in the input's `value`.
 *
 * Pattern for an Input component:
 *
 * ```ts
 * // On input event:
 * if (imeState.composing) {
 *   // Composing — sync value but don't fire change / search.
 *   setLocalValue(event.target.value);
 * } else {
 *   // Not composing — fire change normally.
 *   emit('update:value', event.target.value);
 *   emit('change', event.target.value);
 * }
 * // On compositionend: fire the deferred change.
 * imeState = withCompositionEnd(imeState, event.data);
 * emit('update:value', event.target.value);
 * emit('change', event.target.value);
 * ```
 *
 * The state machine is pure-data; mutations happen via transactions
 * matching the FieldState pattern (Phase 6).
 */
export interface ImeCompositionState {
  /** `true` while an IME composition is in progress. */
  readonly composing: boolean;
  /**
   * Latest composition text reported by `compositionupdate`. Empty
   * string before any update or after composition ends. Useful when
   * adapters want to preview the in-flight composition (e.g. autocomplete
   * popovers that ignore composition text vs commit text).
   */
  readonly compositionText: string;
}

export function createImeCompositionState(): ImeCompositionState {
  return { composing: false, compositionText: '' };
}

/** Mark the start of an IME composition. */
export function withCompositionStart(_state: ImeCompositionState): ImeCompositionState {
  return { composing: true, compositionText: '' };
}

/** Update the in-flight composition text from a `compositionupdate` event. */
export function withCompositionUpdate(
  state: ImeCompositionState,
  text: string,
): ImeCompositionState {
  if (state.composing && state.compositionText === text) return state;
  return { composing: true, compositionText: text };
}

/**
 * Mark the end of an IME composition. The `text` argument is the
 * confirmed composition data (typically the value already reflected in
 * the input element); the returned state always has `composing: false`
 * and `compositionText: ''` since composition is no longer in flight.
 */
export function withCompositionEnd(
  _state: ImeCompositionState,
  _text: string,
): ImeCompositionState {
  return { composing: false, compositionText: '' };
}
