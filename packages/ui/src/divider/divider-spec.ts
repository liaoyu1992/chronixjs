/**
 * Divider IR — Phase 13 (2026-06-02). Tier A pure-visual primitive.
 * Mirrors the Phase 11 Button + Phase 13 Tag pattern: adapter
 * component → `resolveDividerClassList` pure helper → static CSS
 * via `ensureChronixDividerStyles` → theme tokens via CSS-var
 * fallback.
 *
 * Two modes:
 *
 * - **Horizontal** (default): a full-width line with optional title
 *   content positioned left / center / right along the line. The
 *   adapter component renders a `<div class="cx-ui-divider">`
 *   containing a label span when title content is supplied.
 * - **Vertical**: a thin vertical bar for inline use (e.g. between
 *   menu items, breadcrumb segments). Title content is suppressed in
 *   vertical mode (the rule is "vertical dividers don't carry text" —
 *   matches the reference library behavior + most design systems).
 *
 * Public surface:
 *
 * - **`DividerTitlePlacement`** — `'left' | 'center' | 'right'`. Where
 *   the title slot sits along a horizontal divider.
 * - **`DividerProps`** + **`defaultDividerProps`** — declarative
 *   props bag with sensible defaults.
 * - **`resolveDividerClassList(props, hasTitle)`** pure helper — same
 *   class set across adapters; takes a second arg because the
 *   `--with-title` modifier depends on whether the adapter resolved
 *   any content into the title slot (Vue 3 slot vs Vue 2 slot vs
 *   React `children` all surface this differently at the framework
 *   level but the class set must match).
 */

/** Placement of the title slot along a horizontal divider. */
export type DividerTitlePlacement = 'left' | 'center' | 'right';

/**
 * Declarative props consumed by `ChronixDivider` adapters. Pure-data;
 * no event handlers (dividers are non-interactive).
 */
export interface DividerProps {
  /**
   * When `true`, the divider renders as a thin vertical bar (inline).
   * The title slot is suppressed in vertical mode.
   */
  readonly vertical: boolean;
  /**
   * Where to place the title slot along a horizontal divider.
   * Ignored when `vertical: true`. Default `'center'`.
   */
  readonly titlePlacement: DividerTitlePlacement;
  /** When `true`, the line renders as a dashed border. */
  readonly dashed: boolean;
}

/**
 * Sensible defaults for `DividerProps`. Adapters spread + override:
 *
 * ```ts
 * const props: DividerProps = { ...defaultDividerProps, vertical: true };
 * ```
 */
export const defaultDividerProps: DividerProps = {
  vertical: false,
  titlePlacement: 'center',
  dashed: false,
};
