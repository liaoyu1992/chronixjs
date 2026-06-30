/**
 * Button IR — . First Tier A component through the
 * full chronix-ui pipeline (IR → adapter SFC → mount test).
 *
 * Per UI_MIGRATION_PLAN.md Button is the pilot vertical that
 * proves the IR + ChronixUIContext + theme + adapter pattern works
 * end-to-end. Subsequent Tier A components batch off this template.
 *
 * The IR ships:
 *
 * - **Props type** + **default-prop constants** (this file).
 * - **`resolveButtonClassList`** pure helper (`./resolve-button-class-list.ts`)
 *   that maps props → array of `cx-ui-button-*` class names. Pure so
 *   the vue3 / vue2 / react adapters all derive the same class set.
 *
 * Theme tokens live in `theme/chronix-ui-theme.ts` as the `button` slice
 * — the adapter's per-instance styles read those via
 * CSS-var fallback (`var(--cx-ui-button-bg-color, fallback)`).
 */

/** Visual variant of the button — drives bg + border + text color tokens. */
export type ButtonVariant = 'default' | 'primary';

/** Sizing token — drives height + padding + font tokens. */
export type ButtonSize = 'small' | 'medium' | 'large';

/** HTML `<button type>` attribute values. */
export type ButtonHtmlType = 'button' | 'submit' | 'reset';

/**
 * Declarative props consumed by `ChronixButton` adapters. Pure-data;
 * no event handlers (events live in adapter prop signatures since their
 * shape is framework-specific).
 */
export interface ButtonProps {
  /** Visual variant. Default `'default'`. */
  readonly variant: ButtonVariant;
  /**
   * Sizing token. Default falls back to `ctx.size` (
   * `ChronixUIContext.size`); when context is unavailable, defaults
   * to `'medium'`. The default-prop constant uses `'medium'`.
   */
  readonly size: ButtonSize;
  /** When `true`, the button is non-interactive and visually muted. */
  readonly disabled: boolean;
  /**
   * When `true`, the button spans the full width of its parent
   * container (typical for form submit + mobile UX).
   */
  readonly block: boolean;
  /** HTML `<button type>` attribute. Default `'button'` (prevents accidental form submit). */
  readonly htmlType: ButtonHtmlType;
}

/**
 * Sensible defaults for `ButtonProps`. Adapters spread + override:
 *
 * ```ts
 * const props: ButtonProps = { ...defaultButtonProps, variant: 'primary' };
 * ```
 *
 * Note `htmlType` defaults to `'button'` (not the browser default
 * `'submit'`) so buttons inside `<form>` don't accidentally trigger
 * form submission when consumers forget to set the attribute.
 */
export const defaultButtonProps: ButtonProps = {
  variant: 'default',
  size: 'medium',
  disabled: false,
  block: false,
  htmlType: 'button',
};
