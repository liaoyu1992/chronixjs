import {
  defaultSkeletonProps,
  ensureChronixSkeletonStyles,
  formatSkeletonSize,
  resolveSkeletonClassList,
  type SkeletonShape,
} from '@chronixjs/ui';
import { useEffect, useMemo, type CSSProperties, type HTMLAttributes } from 'react';

/**
 * Props for `<ChronixSkeleton>` in the React adapter. Mirrors the Vue
 * adapters' prop bag.
 */
export interface ChronixSkeletonProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'width' | 'height'
> {
  readonly shape?: SkeletonShape;
  readonly width?: string | number | undefined;
  readonly height?: string | number | undefined;
  readonly animated?: boolean;
  readonly round?: boolean;
}

/**
 * `<ChronixSkeleton>` — React port of the Skeleton.
 * Verbatim surface mirror of the Vue adapters.
 */
export function ChronixSkeleton(props: ChronixSkeletonProps): JSX.Element {
  const {
    shape = defaultSkeletonProps.shape,
    width = defaultSkeletonProps.width,
    height = defaultSkeletonProps.height,
    animated = defaultSkeletonProps.animated,
    round = defaultSkeletonProps.round,
    style: incomingStyle,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixSkeletonStyles();
  }, []);

  const resolvedProps = useMemo(
    () => ({ shape, width, height, animated, round }),
    [shape, width, height, animated, round],
  );

  const classList = useMemo(
    () => resolveSkeletonClassList(resolvedProps).join(' '),
    [resolvedProps],
  );

  const style = useMemo<CSSProperties>(() => {
    const base: CSSProperties = { ...(incomingStyle ?? {}) };
    const w = formatSkeletonSize(resolvedProps.width);
    const h = formatSkeletonSize(resolvedProps.height);
    if (w !== undefined) base.width = w;
    if (h !== undefined) base.height = h;
    return base;
  }, [resolvedProps.width, resolvedProps.height, incomingStyle]);

  return <div {...rest} className={classList} style={style} />;
}
