/**
 * Ellipsis IR — . Tier A text-truncation
 * primitive with native HTML `title` attribute tooltip.
 *
 * Per Decision B.1 the full-text tooltip is the browser-
 * native `title` HTML attribute; rich-content Popover-rendered
 * tooltips are deferred once Tier B Popover lands.
 * Per Decision C.1 the multi-line truncation uses
 * `-webkit-line-clamp` for `lineClamp >= 2` and the classic
 * `text-overflow: ellipsis` three-piece for `lineClamp === 1`.
 *
 * Public surface:
 *
 * - **`EllipsisProps`** + **`defaultEllipsisProps`** — declarative
 *   props consumed by `ChronixEllipsis` adapters.
 */

export interface EllipsisProps {
  /** Full text content to display. */
  readonly content: string;
  /**
   * When `true`, the adapter sets a native HTML `title="content"`
   * attribute on the root `<span>`. When `false`, no tooltip
   * surface is emitted.
   *
   * ships the native `title` attribute only; rich-content
   * Popover-rendered tooltips are deferred per
   * Decision B.1 (depends on Tier B Popover).
   */
  readonly tooltip: boolean;
  /**
   * Number of visible lines before truncation kicks in. `1`
   * (default) emits the single-line `text-overflow: ellipsis`
   * three-piece CSS (`white-space: nowrap; overflow: hidden;
   * text-overflow: ellipsis`). `>= 2` emits the
   * `-webkit-line-clamp: N` multi-line truncation
   * (`display: -webkit-box; -webkit-line-clamp: N;
   * -webkit-box-orient: vertical; overflow: hidden`).
   *
   * The CSS stylesheet pre-declares 5 modifier rules
   * (`--lines-1` through `--lines-5`) for the common case
   * 1..5; non-integer or out-of-range values fall through to
   * the single-line default at the CSS level.
   */
  readonly lineClamp: number;
}

export const defaultEllipsisProps: EllipsisProps = {
  content: '',
  tooltip: true,
  lineClamp: 1,
};
