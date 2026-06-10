import { ensureChronixLayoutStyles, resolveLayoutContentClassList } from '@chronixjs/ui';
import { useEffect, type HTMLAttributes, type ReactNode } from 'react';

export interface ChronixLayoutContentProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  readonly children?: ReactNode;
}

export function ChronixLayoutContent(props: ChronixLayoutContentProps): JSX.Element {
  const { children, ...rest } = props;
  useEffect(() => {
    ensureChronixLayoutStyles();
  }, []);
  return (
    <main {...rest} className={resolveLayoutContentClassList().join(' ')}>
      {children}
    </main>
  );
}
