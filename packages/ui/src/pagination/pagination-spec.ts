/**
 * Pagination component IR — .
 *
 * Page navigation with ellipsis, page size picker, quick jumper.
 * Value is the current page number (1-based).
 */

export interface PaginationProps {
  /** Current page (1-based). Default 1. */
  readonly page: number;
  /** Total number of pages. Default 1. */
  readonly pageCount: number;
  /** Total item count (alternative to pageCount). */
  readonly itemCount: number;
  /** Items per page (used with itemCount). Default 10. */
  readonly pageSize: number;
  /** Available page sizes for the picker. */
  readonly pageSizes: readonly number[];
  /** Show page size picker. Default false. */
  readonly showSizePicker: boolean;
  /** Show quick jumper input. Default false. */
  readonly showQuickJumper: boolean;
  /** Number of page slots visible. Default 9. */
  readonly pageSlot: number;
  /** Disable pagination. */
  readonly disabled: boolean;
}

export const defaultPaginationProps: PaginationProps = {
  page: 1,
  pageCount: 1,
  itemCount: 0,
  pageSize: 10,
  pageSizes: [10],
  showSizePicker: false,
  showQuickJumper: false,
  pageSlot: 9,
  disabled: false,
};
