/**
 * Scrollbar IR — Phase 35. Custom-styled scrollbar container
 * with hover/none trigger modes.
 */

export interface ScrollbarProps {
  /** When to show the scrollbar. */
  readonly trigger?: 'hover' | 'none' | undefined;
  /** Whether horizontal scrolling is enabled. */
  readonly xScrollable?: boolean | undefined;
}

export const defaultScrollbarProps: ScrollbarProps = {
  trigger: 'hover',
  xScrollable: false,
};
