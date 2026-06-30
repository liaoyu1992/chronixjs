import {
  defaultIconWrapperProps,
  ensureChronixIconWrapperStyles,
  resolveIconWrapperClassList,
} from '@chronixjs/ui';
import { useEffect, useMemo, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';

export interface ChronixIconWrapperProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  'children' | 'color'
> {
  readonly size?: number;
  readonly color?: string | undefined;
  readonly children?: ReactNode;
}

export function ChronixIconWrapper(props: ChronixIconWrapperProps): React.ReactElement {
  const {
    size = defaultIconWrapperProps.size,
    color = defaultIconWrapperProps.color,
    children,
    ...rest
  } = props;
  useEffect(() => {
    ensureChronixIconWrapperStyles();
  }, []);
  const className = useMemo(
    () => resolveIconWrapperClassList({ size, color }).join(' '),
    [size, color],
  );
  const style: CSSProperties = { width: `${size}px`, height: `${size}px` };
  if (color !== undefined) style.color = color;
  return (
    <span {...rest} className={className} style={style}>
      {children}
    </span>
  );
}
