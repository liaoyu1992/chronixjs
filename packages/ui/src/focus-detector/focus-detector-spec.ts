/**
 * FocusDetector component IR — . Tier B
 * transparent-wrapper event observer. Emits `focus(event)` when focus
 * enters the wrapper from outside; emits `blur(event)` when focus
 * leaves entirely.
 *
 * Uses `focusin` / `focusout` (which bubble + carry `relatedTarget`)
 * rather than `focus` / `blur` (which don't bubble).
 *
 * Out-of-scope (v0.2):
 * - `focusWithin: boolean` state property (emitted as event only).
 * - `scope` prop limiting to specific descendants.
 * - Keyboard event integration.
 */

export interface FocusDetectorProps {
  /** When `true`, no events are emitted regardless of focus changes. */
  readonly disabled: boolean;
}

export const defaultFocusDetectorProps: FocusDetectorProps = {
  disabled: false,
};

/**
 * Whether a `focusin` / `focusout` event represents focus crossing
 * the wrapper boundary (i.e. the new owner is NOT a descendant of the
 * wrapper). Pure helper consumed by all 3 adapters.
 *
 * - `focusin` with `relatedTarget` outside (or `null`) → focus
 *   entering from outside → emit `focus`.
 * - `focusout` with `relatedTarget` outside (or `null`) → focus
 *   leaving entirely → emit `blur`.
 * - Both with `relatedTarget` already inside → no boundary crossing
 *   (skip emit).
 *
 * `null` `relatedTarget` (focus moves to body, no specific element)
 * is treated as "outside the wrapper".
 */
export function shouldEmitFocusDetectorEvent(input: {
  readonly currentTarget: HTMLElement;
  readonly relatedTarget: HTMLElement | null;
}): boolean {
  const { currentTarget, relatedTarget } = input;
  if (relatedTarget === null) return true;
  return !currentTarget.contains(relatedTarget);
}
