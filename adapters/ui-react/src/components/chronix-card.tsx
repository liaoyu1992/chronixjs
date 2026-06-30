import {
  defaultCardProps,
  ensureChronixCardStyles,
  resolveCardClassList,
  type CardProps,
  type CardSize,
} from '@chronixjs/ui';
import { useEffect, useMemo, type HTMLAttributes, type ReactNode } from 'react';

export interface ChronixCardProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'title'
> {
  readonly size?: CardSize;
  readonly title?: string | undefined;
  readonly bordered?: boolean;
  readonly hoverable?: boolean;
  readonly embedded?: boolean;
  /**
   * Optional footer region. Pass any ReactNode (typically buttons or
   * a summary row). When `undefined` (default), the `__footer`
   * element is not rendered and `--with-footer` is omitted from the
   * root class set.
   */
  readonly footer?: ReactNode;
  readonly children?: ReactNode;
}

/**
 * `<ChronixCard>` — React 18 port of the Card. The "footer"
 * region is exposed as a named React prop rather than `children` to
 * mirror the Vue `footer` named slot semantically.
 */
export function ChronixCard(props: ChronixCardProps): React.ReactElement {
  const {
    size = defaultCardProps.size,
    title = defaultCardProps.title,
    bordered = defaultCardProps.bordered,
    hoverable = defaultCardProps.hoverable,
    embedded = defaultCardProps.embedded,
    footer,
    children,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixCardStyles();
  }, []);

  const resolvedProps = useMemo<CardProps>(
    () => ({ size, title, bordered, hoverable, embedded }),
    [size, title, bordered, hoverable, embedded],
  );

  const hasFooter = footer !== undefined && footer !== null && footer !== false;

  const classList = useMemo(
    () => resolveCardClassList(resolvedProps, hasFooter).join(' '),
    [resolvedProps, hasFooter],
  );

  return (
    <div {...rest} className={classList}>
      {title !== undefined ? <div className="cx-ui-card__header">{title}</div> : null}
      <div className="cx-ui-card__content">{children}</div>
      {hasFooter ? <div className="cx-ui-card__footer">{footer}</div> : null}
    </div>
  );
}
