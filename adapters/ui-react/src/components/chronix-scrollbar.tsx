import {
  defaultScrollbarProps,
  ensureChronixScrollbarStyles,
  resolveScrollbarClassList,
  type ScrollbarProps,
} from '@chronixjs/ui';
import { useEffect, useMemo, type HTMLAttributes, type ReactNode } from 'react';

export interface ChronixScrollbarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  readonly trigger?: 'hover' | 'none' | undefined;
  readonly xScrollable?: boolean | undefined;
  readonly children?: ReactNode;
}

/**
 * `<ChronixScrollbar>` — React 18 port of the Phase 35 Scrollbar.
 * Wraps children in a custom-styled overflow container.
 */
export function ChronixScrollbar(props: ChronixScrollbarProps): JSX.Element {
  const {
    trigger = defaultScrollbarProps.trigger,
    xScrollable = defaultScrollbarProps.xScrollable,
    children,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixScrollbarStyles();
  }, []);

  const resolvedProps = useMemo<Pick<ScrollbarProps, 'trigger'>>(() => ({ trigger }), [trigger]);

  const classList = useMemo(
    () => resolveScrollbarClassList(resolvedProps).join(' '),
    [resolvedProps],
  );

  const overflowStyle = useMemo(
    () => ({
      overflowY: 'auto' as const,
      overflowX: xScrollable ? ('auto' as const) : ('hidden' as const),
    }),
    [xScrollable],
  );

  return (
    <div data-testid="scrollbar-root" className={classList} style={overflowStyle} {...rest}>
      {children}
    </div>
  );
}
