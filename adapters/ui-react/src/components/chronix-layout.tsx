import {
  defaultLayoutProps,
  ensureChronixLayoutStyles,
  resolveLayoutClassList,
} from '@chronixjs/ui';
import { Children, isValidElement, useEffect, type HTMLAttributes, type ReactNode } from 'react';

import { ChronixLayoutSider } from './chronix-layout-sider.js';

export interface ChronixLayoutProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  readonly hasSider?: boolean;
  readonly position?: 'static' | 'absolute';
  readonly children?: ReactNode;
}

export function ChronixLayout(props: ChronixLayoutProps): React.ReactElement {
  const { hasSider, position = defaultLayoutProps.position, children, ...rest } = props;
  useEffect(() => {
    ensureChronixLayoutStyles();
  }, []);
  const detectedHasSider = Children.toArray(children).some(
    (child) => isValidElement(child) && child.type === ChronixLayoutSider,
  );
  const effectiveHasSider = hasSider ?? detectedHasSider;
  return (
    <section
      {...rest}
      className={resolveLayoutClassList({
        hasSider: effectiveHasSider,
        position,
      }).join(' ')}
    >
      {children}
    </section>
  );
}
