import {
  defaultResultProps,
  ensureChronixResultStyles,
  RESULT_ICON_BY_STATUS,
  resolveResultClassList,
  type ResultStatus,
} from '@chronixjs/ui';
import { Children, useEffect, useMemo, type HTMLAttributes, type ReactNode } from 'react';

export interface ChronixResultProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'title'
> {
  readonly status?: ResultStatus;
  readonly title?: string | undefined;
  readonly description?: string | undefined;
  readonly icon?: ReactNode;
  readonly children?: ReactNode;
}

/**
 * `<ChronixResult>` — React port of the Result.
 */
export function ChronixResult(props: ChronixResultProps): JSX.Element {
  const {
    status = defaultResultProps.status,
    title = defaultResultProps.title,
    description = defaultResultProps.description,
    icon,
    children,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixResultStyles();
  }, []);

  const hasExtra = Children.count(children) > 0;

  const classList = useMemo(
    () => resolveResultClassList({ status, title, description }, hasExtra).join(' '),
    [status, title, description, hasExtra],
  );

  return (
    <div {...rest} className={classList}>
      <div className="cx-ui-result__icon" aria-hidden="true">
        {icon ?? RESULT_ICON_BY_STATUS[status]}
      </div>
      {title !== undefined ? <div className="cx-ui-result__title">{title}</div> : null}
      {description !== undefined ? (
        <div className="cx-ui-result__description">{description}</div>
      ) : null}
      {hasExtra ? <div className="cx-ui-result__extra">{children}</div> : null}
    </div>
  );
}
