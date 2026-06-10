import {
  defaultEquationProps,
  ensureChronixEquationStyles,
  resolveEquationClassList,
  type EquationDisplay,
} from '@chronixjs/ui';
import { createElement, useEffect, useMemo, type HTMLAttributes } from 'react';

export interface ChronixEquationProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'children' | 'dangerouslySetInnerHTML'
> {
  readonly value?: string;
  readonly display?: EquationDisplay;
}

export function ChronixEquation(props: ChronixEquationProps): JSX.Element {
  const {
    value = defaultEquationProps.value,
    display = defaultEquationProps.display,
    ...rest
  } = props;
  useEffect(() => {
    ensureChronixEquationStyles();
  }, []);
  const className = useMemo(
    () => resolveEquationClassList({ value, display }).join(' '),
    [value, display],
  );
  // React's JSX.IntrinsicElements doesn't include <math>; route
  // through createElement with the literal tag name.
  return createElement('math', {
    ...rest,
    className,
    display,
    dangerouslySetInnerHTML: { __html: value },
  });
}
