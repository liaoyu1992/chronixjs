import {
  defaultElementProps,
  ensureChronixElementStyles,
  resolveElementClassList,
} from '@chronixjs/ui';
import { createElement, useEffect, useMemo, type HTMLAttributes, type ReactNode } from 'react';

export interface ChronixElementProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  readonly tag?: string;
  readonly inline?: boolean;
  readonly children?: ReactNode;
}

export function ChronixElement(props: ChronixElementProps): React.ReactElement {
  const {
    tag = defaultElementProps.tag,
    inline = defaultElementProps.inline,
    children,
    ...rest
  } = props;
  useEffect(() => {
    ensureChronixElementStyles();
  }, []);
  const className = useMemo(
    () => resolveElementClassList({ tag, inline }).join(' '),
    [tag, inline],
  );
  return createElement(tag, { ...rest, className }, children);
}
