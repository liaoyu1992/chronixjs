import {
  defaultDividerProps,
  ensureChronixDividerStyles,
  resolveDividerClassList,
  type DividerTitlePlacement,
} from '@chronixjs/ui';
import { Children, useEffect, useMemo, type HTMLAttributes, type ReactNode } from 'react';

/**
 * Props for `<ChronixDivider>` in the React adapter. Mirrors the Vue
 * adapters' prop bag.
 */
export interface ChronixDividerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  readonly vertical?: boolean;
  readonly titlePlacement?: DividerTitlePlacement;
  readonly dashed?: boolean;
  readonly children?: ReactNode;
}

/**
 * `<ChronixDivider>` — React 18 port of the Divider pilot.
 * Verbatim surface mirror of the Vue adapters. The `hasTitle`
 * resolution uses React's `Children.count` to mirror Vue's
 * "did the default slot resolve to any nodes?" semantic.
 */
export function ChronixDivider(props: ChronixDividerProps): React.ReactElement {
  const {
    vertical = defaultDividerProps.vertical,
    titlePlacement = defaultDividerProps.titlePlacement,
    dashed = defaultDividerProps.dashed,
    children,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixDividerStyles();
  }, []);

  const hasTitle = !vertical && Children.count(children) > 0;

  const classList = useMemo(
    () => resolveDividerClassList({ vertical, titlePlacement, dashed }, hasTitle).join(' '),
    [vertical, titlePlacement, dashed, hasTitle],
  );

  return (
    <div {...rest} role="separator" className={classList}>
      {hasTitle ? <span className="cx-ui-divider__title">{children}</span> : null}
    </div>
  );
}
