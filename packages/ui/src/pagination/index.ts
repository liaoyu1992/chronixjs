/**
 * Pagination module — .
 *
 * Framework-agnostic pagination IR: page computation, ellipsis
 * logic, BEM class resolvers, CSS.
 */

export type { PaginationProps } from './pagination-spec.js';
export { defaultPaginationProps } from './pagination-spec.js';

export { computePageCount, computePaginationPages } from './compute-pagination-pages.js';

export type {
  ResolvePaginationButtonClassListInput,
  ResolvePaginationItemClassListInput,
  ResolvePaginationRootClassListInput,
} from './resolve-pagination-class-list.js';
export {
  resolvePaginationButtonClassList,
  resolvePaginationEllipsisClassList,
  resolvePaginationItemClassList,
  resolvePaginationJumperClassList,
  resolvePaginationRootClassList,
  resolvePaginationSizePickerClassList,
} from './resolve-pagination-class-list.js';

export { CHRONIX_PAGINATION_CSS, ensureChronixPaginationStyles } from './pagination-styles.js';
