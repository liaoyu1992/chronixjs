import { ensureChronixLayoutStyles, resolveLayoutFooterClassList } from '@chronixjs/ui';
import { useEffect, type HTMLAttributes, type ReactNode } from 'react';

export interface ChronixLayoutFooterProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  readonly children?: ReactNode;
}

export function ChronixLayoutFooter(props: ChronixLayoutFooterProps): JSX.Element {
  const { children, ...rest } = props;
  useEffect(() => {
    ensureChronixLayoutStyles();
  }, []);
  return (
    <footer {...rest} className={resolveLayoutFooterClassList().join(' ')}>
      {children}
    </footer>
  );
}
