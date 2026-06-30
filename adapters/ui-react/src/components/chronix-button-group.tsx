import {
  defaultButtonGroupProps,
  ensureChronixButtonGroupStyles,
  resolveButtonGroupClassList,
  type ButtonSize,
} from '@chronixjs/ui';
import { useEffect, useMemo, type HTMLAttributes, type ReactNode } from 'react';

export interface ChronixButtonGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  readonly vertical?: boolean;
  readonly size?: ButtonSize | undefined;
  readonly children?: ReactNode;
}

export function ChronixButtonGroup(props: ChronixButtonGroupProps): React.ReactElement {
  const {
    vertical = defaultButtonGroupProps.vertical,
    size = defaultButtonGroupProps.size,
    children,
    ...rest
  } = props;
  useEffect(() => {
    ensureChronixButtonGroupStyles();
  }, []);
  const className = useMemo(
    () => resolveButtonGroupClassList({ vertical, size }).join(' '),
    [vertical, size],
  );
  return (
    <div {...rest} className={className} role="group">
      {children}
    </div>
  );
}
