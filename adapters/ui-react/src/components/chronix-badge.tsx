import {
  defaultBadgeProps,
  ensureChronixBadgeStyles,
  formatBadgeValue,
  resolveBadgeClassList,
  resolveBadgeSupClassList,
  type BadgeType,
} from '@chronixjs/ui';
import { Children, useEffect, useMemo, type HTMLAttributes, type ReactNode } from 'react';

/**
 * Props for `<ChronixBadge>` in the React adapter. Mirrors the Vue
 * adapters' prop bag.
 */
export interface ChronixBadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  readonly value?: number | string | undefined;
  readonly max?: number | undefined;
  readonly dot?: boolean;
  readonly type?: BadgeType;
  readonly processing?: boolean;
  readonly show?: boolean;
  readonly children?: ReactNode;
}

/**
 * `<ChronixBadge>` — React 18 port of the Phase 14 Badge pilot.
 * Verbatim surface mirror of the Vue adapters. The standalone vs
 * wrapped mode resolution uses React's `Children.count` to mirror
 * the Vue slot-presence detection.
 */
export function ChronixBadge(props: ChronixBadgeProps): JSX.Element {
  const {
    value = defaultBadgeProps.value,
    max = defaultBadgeProps.max,
    dot = defaultBadgeProps.dot,
    type = defaultBadgeProps.type,
    processing = defaultBadgeProps.processing,
    show = defaultBadgeProps.show,
    children,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixBadgeStyles();
  }, []);

  const standalone = Children.count(children) === 0;

  const resolvedProps = useMemo(
    () => ({ value, max, dot, type, processing, show }),
    [value, max, dot, type, processing, show],
  );

  const rootClassList = useMemo(
    () => resolveBadgeClassList(resolvedProps, standalone).join(' '),
    [resolvedProps, standalone],
  );

  const supClassList = useMemo(
    () => resolveBadgeSupClassList(resolvedProps).join(' '),
    [resolvedProps],
  );

  const displayValue = useMemo(
    () => (resolvedProps.dot ? '' : formatBadgeValue(resolvedProps.value, resolvedProps.max)),
    [resolvedProps.dot, resolvedProps.value, resolvedProps.max],
  );

  return (
    <span {...rest} className={rootClassList}>
      {standalone ? null : children}
      <sup className={supClassList}>{displayValue}</sup>
    </span>
  );
}
