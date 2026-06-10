import { ensureChronixLayoutStyles, resolveLayoutHeaderClassList } from '@chronixjs/ui';
import { useEffect, type HTMLAttributes, type ReactNode } from 'react';

export interface ChronixLayoutHeaderProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  readonly children?: ReactNode;
}

export function ChronixLayoutHeader(props: ChronixLayoutHeaderProps): JSX.Element {
  const { children, ...rest } = props;
  useEffect(() => {
    ensureChronixLayoutStyles();
  }, []);
  return (
    <header {...rest} className={resolveLayoutHeaderClassList().join(' ')}>
      {children}
    </header>
  );
}
