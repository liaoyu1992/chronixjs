import {
  defaultFlexProps,
  ensureChronixFlexStyles,
  resolveFlexClassList,
  resolveFlexGap,
  type FlexAlign,
  type FlexDirection,
  type FlexGap,
  type FlexJustify,
  type FlexWrap,
} from '@chronixjs/ui';
import { useEffect, useMemo, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';

export interface ChronixFlexProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  readonly direction?: FlexDirection;
  readonly wrap?: FlexWrap;
  readonly align?: FlexAlign | undefined;
  readonly justify?: FlexJustify | undefined;
  readonly gap?: FlexGap | undefined;
  readonly inline?: boolean;
  readonly children?: ReactNode;
}

/**
 * `<ChronixFlex>` — React port of the Phase 17 Flex.
 */
export function ChronixFlex(props: ChronixFlexProps): JSX.Element {
  const {
    direction = defaultFlexProps.direction,
    wrap = defaultFlexProps.wrap,
    align = defaultFlexProps.align,
    justify = defaultFlexProps.justify,
    gap = defaultFlexProps.gap,
    inline = defaultFlexProps.inline,
    style: incomingStyle,
    children,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixFlexStyles();
  }, []);

  const resolvedProps = useMemo(
    () => ({ direction, wrap, align, justify, gap, inline }),
    [direction, wrap, align, justify, gap, inline],
  );

  const classList = useMemo(() => resolveFlexClassList(resolvedProps).join(' '), [resolvedProps]);

  const style = useMemo<CSSProperties>(() => {
    const base: CSSProperties = { ...(incomingStyle ?? {}) };
    const resolvedGap = resolveFlexGap(resolvedProps.gap);
    if (resolvedGap !== undefined) base.gap = resolvedGap;
    return base;
  }, [resolvedProps.gap, incomingStyle]);

  return (
    <div {...rest} className={classList} style={style}>
      {children}
    </div>
  );
}
