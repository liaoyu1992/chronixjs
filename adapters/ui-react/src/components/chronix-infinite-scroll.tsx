import {
  defaultInfiniteScrollProps,
  ensureChronixInfiniteScrollStyles,
  resolveInfiniteScrollClassList,
} from '@chronixjs/ui';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

export interface ChronixInfiniteScrollProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  readonly distance?: number;
  readonly loading?: boolean | undefined;
  readonly onLoad?: () => void;
  readonly children?: ReactNode;
}

/**
 * `<ChronixInfiniteScroll>` — React 18 port of the InfiniteScroll.
 * Uses IntersectionObserver to detect when the user is near the bottom
 * and calls `onLoad` for more data.
 */
export function ChronixInfiniteScroll(props: ChronixInfiniteScrollProps): React.ReactElement {
  const {
    distance = defaultInfiniteScrollProps.distance,
    loading = defaultInfiniteScrollProps.loading,
    onLoad,
    children,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixInfiniteScrollStyles();
  }, []);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const onLoadRef = useRef(onLoad);
  onLoadRef.current = onLoad;

  const classList = useMemo(() => resolveInfiniteScrollClassList().join(' '), []);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !loading) {
          onLoadRef.current?.();
        }
      }
    },
    [loading],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (sentinel === null) return;

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: `${distance}px`,
    });
    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [handleIntersect, distance]);

  return (
    <div {...rest} data-testid="infinite-scroll-root" className={classList}>
      {children}
      <div ref={sentinelRef} className="cx-ui-infinite-scroll__sentinel" />
      {loading ? <div className="cx-ui-infinite-scroll__loading">Loading...</div> : null}
    </div>
  );
}
