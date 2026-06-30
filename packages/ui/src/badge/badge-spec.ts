/**
 * Badge IR — . Tier A "wrap-a-child" component.
 *
 * Mirrors the pattern but introduces a new shape: Badge
 * wraps a child element (slot / children) and renders an absolutely-
 * positioned `__sup` indicator overlay containing the badge content.
 * Standalone mode (no child) is also supported — the indicator
 * renders inline.
 *
 * Public surface:
 *
 * - **`BadgeType`** — semantic color of the indicator (5 types: default
 *   + success / warning / error / info; "primary" is omitted because
 *   the reference library merges primary == default for badges).
 * - **`BadgeProps`** + **`defaultBadgeProps`** — declarative props
 *   bag + defaults.
 * - **`resolveBadgeClassList(props)`** pure helper — class set on the
 *   `cx-ui-badge` root.
 * - **`resolveBadgeSupClassList(props)`** pure helper — class set on
 *   the `cx-ui-badge__sup` indicator inner element. Separate function
 *   because the indicator carries its own type / dot / processing
 *   modifiers (the root only carries `--standalone` / `--show` state).
 * - **`formatBadgeValue(value, max)`** pure helper — converts a
 *   numeric/string `value` + optional `max` into the display string
 *   (`999` + `max=99` → `"99+"`; `5` + `max=99` → `"5"`; `'NEW'` →
 *   `"NEW"`).
 *
 * Theme tokens for Badge live in the `badge` slice of `ChronixUITheme`.
 * Adapters apply tokens via CSS-var fallback in static CSS rules.
 */

/** Semantic indicator color. */
export type BadgeType = 'default' | 'success' | 'warning' | 'error' | 'info';

/**
 * Declarative props consumed by `ChronixBadge` adapters. Pure-data;
 * the wrapped-child resolution lives at the framework layer (Vue slot
 * / React children) and surfaces in the adapter component as a runtime
 * detection — not part of this typed props bag.
 */
export interface BadgeProps {
  /**
   * Badge content. When numeric, can be truncated by `max`. When
   * `undefined`, the badge renders nothing visible (combined with
   * `dot: true` for a value-less indicator).
   */
  readonly value: number | string | undefined;
  /**
   * Numeric truncation threshold. When `value` is a number greater
   * than `max`, the displayed string becomes `${max}+`. Ignored when
   * `value` is a string or `undefined`. Set to `undefined` to disable
   * truncation.
   */
  readonly max: number | undefined;
  /**
   * When `true`, the badge renders as a small filled circle with no
   * value text (regardless of `value`). Common for "unread"
   * indicators where only the presence/absence matters.
   */
  readonly dot: boolean;
  /** Semantic type — drives bg + text color tokens. Default `'default'`. */
  readonly type: BadgeType;
  /**
   * When `true`, an attention-grabbing pulse animation runs on the
   * indicator. Common for in-progress / "live" states.
   */
  readonly processing: boolean;
  /**
   * When `false`, the badge is hidden (CSS `display: none` on the
   * indicator). Useful for "0 unread" cases that want to hide rather
   * than render an empty / zero badge.
   */
  readonly show: boolean;
}

/**
 * Sensible defaults for `BadgeProps`.
 */
export const defaultBadgeProps: BadgeProps = {
  value: undefined,
  max: undefined,
  dot: false,
  type: 'default',
  processing: false,
  show: true,
};
