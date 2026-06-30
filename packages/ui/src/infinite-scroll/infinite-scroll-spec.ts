/**
 * InfiniteScroll IR. Container that emits a load-more
 * event when the user scrolls near the bottom.
 */

export interface InfiniteScrollProps {
  /** Distance in px from bottom to trigger load. */
  readonly distance?: number;
  /** Whether more content is currently loading. */
  readonly loading?: boolean | undefined;
}

export const defaultInfiniteScrollProps: InfiniteScrollProps = {
  distance: 0,
  loading: false,
};
