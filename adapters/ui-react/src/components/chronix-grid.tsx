import {
  defaultGridProps,
  ensureChronixGridStyles,
  resolveGridClassList,
  resolveGridGap,
  resolveGridTracks,
} from '@chronixjs/ui';
import { useEffect, useMemo, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';

export interface ChronixGridProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  readonly cols?: number | string | undefined;
  readonly xGap?: number | undefined;
  readonly yGap?: number | undefined;
  readonly inline?: boolean;
  readonly children?: ReactNode;
}

/**
 * `<ChronixGrid>` — React port of the Grid.
 */
export function ChronixGrid(props: ChronixGridProps): React.ReactElement {
  const {
    cols = defaultGridProps.cols,
    xGap = defaultGridProps.xGap,
    yGap = defaultGridProps.yGap,
    inline = defaultGridProps.inline,
    style: incomingStyle,
    children,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixGridStyles();
  }, []);

  const resolvedProps = useMemo(() => ({ cols, xGap, yGap, inline }), [cols, xGap, yGap, inline]);

  const classList = useMemo(() => resolveGridClassList(resolvedProps).join(' '), [resolvedProps]);

  const style = useMemo<CSSProperties>(() => {
    const base: CSSProperties = { ...(incomingStyle ?? {}) };
    const tracks = resolveGridTracks(resolvedProps.cols);
    if (tracks !== undefined) base.gridTemplateColumns = tracks;
    const { columnGap, rowGap } = resolveGridGap(resolvedProps.xGap, resolvedProps.yGap);
    if (columnGap !== undefined) base.columnGap = columnGap;
    if (rowGap !== undefined) base.rowGap = rowGap;
    return base;
  }, [resolvedProps.cols, resolvedProps.xGap, resolvedProps.yGap, incomingStyle]);

  return (
    <div {...rest} className={classList} style={style}>
      {children}
    </div>
  );
}
