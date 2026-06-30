/**
 * Tag IR — . Second Tier A component through the
 * full chronix-ui pipeline. Mirrors the Button pattern:
 * adapter SFC/component → `resolveTagClassList` pure helper → static
 * CSS via `ensureChronixTagStyles` → theme tokens via CSS-var fallback.
 *
 * Per UI_MIGRATION_PLAN.md Tier A, Tag is a "trivial visual" component
 * with a small typed prop bag and no algorithmic state. Public surface:
 *
 * - **Type union** (`TagType`) — drives bg + border + text color tokens
 *   across 6 semantic types matching the reference library's surface.
 * - **Size union** (`TagSize`) — drives height + padding + font tokens.
 * - **`TagProps`** + **`defaultTagProps`** — declarative props bag +
 *   sensible defaults.
 * - **`resolveTagClassList`** pure helper (`./resolve-tag-class-list.ts`)
 *   for cross-adapter class-set consistency.
 *
 * Theme tokens live in the `tag` slice of `ChronixUITheme`. Adapters
 * apply tokens via CSS-var fallback in static CSS rules (
 * Decision A.1).
 */

/** Semantic type of the tag — drives bg + border + text color tokens. */
export type TagType = 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error';

/** Sizing token — drives height + padding + font tokens. */
export type TagSize = 'small' | 'medium' | 'large';

/**
 * Declarative props consumed by `ChronixTag` adapters. Pure-data;
 * no event handlers (events live in adapter prop signatures since
 * their shape is framework-specific).
 */
export interface TagProps {
  /** Semantic type. Default `'default'`. */
  readonly type: TagType;
  /**
   * Sizing token. Default falls back to `ctx.size` (
   * `ChronixUIContext.size`); when context is unavailable, defaults
   * to `'medium'`. The default-prop constant uses `'medium'`.
   */
  readonly size: TagSize;
  /**
   * When `true`, the tag renders with a visible border around the
   * fill (default for `type !== 'default'` looks; `default` type uses
   * a subtle border regardless).
   */
  readonly bordered: boolean;
  /** When `true`, the tag renders with full-pill border-radius. */
  readonly round: boolean;
  /**
   * When `true`, a small `×` button renders inside the tag. Adapters
   * emit a `close` event when the button is clicked; the consumer
   * controls actual removal from a list.
   */
  readonly closable: boolean;
  /** When `true`, the tag is non-interactive and visually muted. */
  readonly disabled: boolean;
}

/**
 * Sensible defaults for `TagProps`. Adapters spread + override:
 *
 * ```ts
 * const props: TagProps = { ...defaultTagProps, type: 'success' };
 * ```
 */
export const defaultTagProps: TagProps = {
  type: 'default',
  size: 'medium',
  bordered: true,
  round: false,
  closable: false,
  disabled: false,
};
