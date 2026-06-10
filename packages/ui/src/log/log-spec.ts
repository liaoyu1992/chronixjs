/**
 * Log IR — Phase 23 (2026-06-03). Tier A terminal-output viewer
 * for CI / deploy / audit-trail / build-output consumption.
 *
 * Per Phase 23 Decision D.1 the per-line number is rendered as
 * real DOM text in a `<span class="cx-ui-log__line-number"
 * aria-hidden="true">` rather than via CSS `counter-increment` +
 * `::before content: counter(line)`. Real DOM text is readable by
 * Playwright + included in copy-paste fidelity + handled
 * consistently by assistive tech.
 *
 * Per Decision A.1 (Phase 21 D.1 echo) the items come exclusively
 * from the `lines: readonly string[]` array prop — no scoped slots
 * / render-props.
 *
 * Public surface:
 *
 * - **`LogProps`** + **`defaultLogProps`** — declarative props
 *   consumed by `ChronixLog` adapters.
 */

export interface LogProps {
  /** Ordered lines to render. Each entry is one row of text. */
  readonly lines: readonly string[];
  /**
   * When `true`, renders a leading `<span class="__line-number"
   * aria-hidden="true">{idx + 1}</span>` per line. Adapter
   * renders the integer text directly in the DOM (D.1) rather
   * than via CSS counter. Default `false`.
   */
  readonly lineNumbers: boolean;
  /**
   * When `true`, renders a `<div class="__loading">loading...</div>`
   * row below the lines. Useful for live-tailing CI logs. Default
   * `false`.
   */
  readonly loading: boolean;
  /**
   * When defined (px), the root `<div>` is constrained via
   * `style="max-height: {N}px; overflow: auto"` and becomes a
   * scroll container. `undefined` lets the root grow to its
   * content height.
   */
  readonly maxHeight: number | undefined;
  /**
   * When `true`, long lines wrap onto multiple visual rows
   * (`white-space: pre-wrap; word-break: break-word`). Default
   * `false` keeps `white-space: pre` so long lines force horizontal
   * scrolling — matches terminal behavior.
   */
  readonly wrapLines: boolean;
}

export const defaultLogProps: LogProps = {
  lines: [],
  lineNumbers: false,
  loading: false,
  maxHeight: undefined,
  wrapLines: false,
};
