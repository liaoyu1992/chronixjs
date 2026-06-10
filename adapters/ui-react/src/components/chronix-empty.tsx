import {
  defaultEmptyProps,
  ensureChronixEmptyStyles,
  resolveEmptyClassList,
  type EmptySize,
} from '@chronixjs/ui';
import { Children, useEffect, useMemo, type HTMLAttributes, type ReactNode } from 'react';

export interface ChronixEmptyProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  readonly size?: EmptySize;
  readonly description?: string | undefined;
  /**
   * Optional custom icon content. When omitted, a Unicode 📦
   * placeholder renders (until the Phase 9 icon registry lands).
   */
  readonly icon?: ReactNode;
  /**
   * Optional action-row content (typically buttons). When supplied,
   * adds `--with-extra` modifier and renders inside `__extra`.
   */
  readonly children?: ReactNode;
}

/**
 * `<ChronixEmpty>` — React 18 port of the Phase 15 Empty.
 */
export function ChronixEmpty(props: ChronixEmptyProps): JSX.Element {
  const {
    size = defaultEmptyProps.size,
    description = defaultEmptyProps.description,
    icon,
    children,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixEmptyStyles();
  }, []);

  const hasExtra = Children.count(children) > 0;

  const classList = useMemo(
    () => resolveEmptyClassList({ size, description }, hasExtra).join(' '),
    [size, description, hasExtra],
  );

  return (
    <div {...rest} className={classList}>
      <div className="cx-ui-empty__icon">{icon ?? '📦'}</div>
      {description !== undefined ? (
        <div className="cx-ui-empty__description">{description}</div>
      ) : null}
      {hasExtra ? <div className="cx-ui-empty__extra">{children}</div> : null}
    </div>
  );
}
