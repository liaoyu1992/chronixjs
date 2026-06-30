import {
  defaultSpaceProps,
  ensureChronixSpaceStyles,
  resolveSpaceClassList,
  resolveSpaceGap,
  type SpaceAlign,
  type SpaceJustify,
  type SpaceSize,
} from '@chronixjs/ui';
import { useEffect, useMemo, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';

export interface ChronixSpaceProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  readonly size?: SpaceSize | number;
  readonly vertical?: boolean;
  readonly wrap?: boolean;
  readonly align?: SpaceAlign | undefined;
  readonly justify?: SpaceJustify | undefined;
  readonly inline?: boolean;
  readonly children?: ReactNode;
}

/**
 * `<ChronixSpace>` — React port of the Space.
 */
export function ChronixSpace(props: ChronixSpaceProps): JSX.Element {
  const {
    size = defaultSpaceProps.size,
    vertical = defaultSpaceProps.vertical,
    wrap = defaultSpaceProps.wrap,
    align = defaultSpaceProps.align,
    justify = defaultSpaceProps.justify,
    inline = defaultSpaceProps.inline,
    style: incomingStyle,
    children,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixSpaceStyles();
  }, []);

  const resolvedProps = useMemo(
    () => ({ size, vertical, wrap, align, justify, inline }),
    [size, vertical, wrap, align, justify, inline],
  );

  const classList = useMemo(() => resolveSpaceClassList(resolvedProps).join(' '), [resolvedProps]);

  const style = useMemo<CSSProperties>(
    () => ({ ...(incomingStyle ?? {}), gap: resolveSpaceGap(resolvedProps.size) }),
    [resolvedProps.size, incomingStyle],
  );

  return (
    <div {...rest} className={classList} style={style}>
      {children}
    </div>
  );
}
