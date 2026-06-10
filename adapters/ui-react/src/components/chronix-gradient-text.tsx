import {
  buildGradientTextBackground,
  defaultGradientTextProps,
  ensureChronixGradientTextStyles,
  resolveGradientTextClassList,
} from '@chronixjs/ui';
import { useEffect, useMemo, type CSSProperties, type HTMLAttributes } from 'react';

export interface ChronixGradientTextProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  'content' | 'children'
> {
  readonly value?: string;
  readonly colors?: readonly [string, string];
  readonly direction?: number;
}

export function ChronixGradientText(props: ChronixGradientTextProps): JSX.Element {
  const {
    value = defaultGradientTextProps.value,
    colors = defaultGradientTextProps.colors,
    direction = defaultGradientTextProps.direction,
    ...rest
  } = props;
  useEffect(() => {
    ensureChronixGradientTextStyles();
  }, []);
  const resolvedProps = { value, colors, direction };
  const className = useMemo(
    () => resolveGradientTextClassList(resolvedProps).join(' '),
    [value, colors, direction],
  );
  const style: CSSProperties = {
    background: buildGradientTextBackground(resolvedProps),
  };
  return (
    <span {...rest} className={className} style={style}>
      {value}
    </span>
  );
}
