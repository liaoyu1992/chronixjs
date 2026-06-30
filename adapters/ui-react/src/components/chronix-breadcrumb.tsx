import {
  defaultBreadcrumbProps,
  ensureChronixBreadcrumbStyles,
  isBreadcrumbItemClickable,
  resolveBreadcrumbClassList,
  resolveBreadcrumbItemClassList,
  type BreadcrumbItem,
} from '@chronixjs/ui';
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

export interface ChronixBreadcrumbProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  readonly items?: readonly BreadcrumbItem[];
  readonly separator?: string;
  /**
   * Custom separator content (overrides `separator` string). React's
   * equivalent of the Vue `separator` slot.
   */
  readonly separatorNode?: ReactNode;
  /**
   * Fires when a clickable item is clicked. Native `<a href>`
   * navigation is NOT suppressed; consumers wanting SPA routing
   * intercept via a separate `onClick` on the wrapping element.
   */
  readonly onItemClick?: (item: BreadcrumbItem) => void;
}

/**
 * `<ChronixBreadcrumb>` — React port of the Breadcrumb.
 */
export function ChronixBreadcrumb(props: ChronixBreadcrumbProps): React.ReactElement {
  const {
    items = defaultBreadcrumbProps.items,
    separator = defaultBreadcrumbProps.separator,
    separatorNode,
    onItemClick,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixBreadcrumbStyles();
  }, []);

  const hasSeparatorSlot = separatorNode !== undefined && separatorNode !== null;

  const classList = useMemo(
    () => resolveBreadcrumbClassList({ items, separator }, hasSeparatorSlot).join(' '),
    [items, separator, hasSeparatorSlot],
  );

  const handleItemClick = useCallback(
    (item: BreadcrumbItem) => {
      if (!isBreadcrumbItemClickable(item)) return;
      onItemClick?.(item);
    },
    [onItemClick],
  );

  return (
    <nav {...rest} className={classList} aria-label="Breadcrumb">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const itemClasses = resolveBreadcrumbItemClassList(item, isLast).join(' ');
        const clickable = isBreadcrumbItemClickable(item);
        const onClick = (): void => handleItemClick(item);

        let itemNode: ReactNode;
        if (item.href !== undefined) {
          itemNode = (
            <a className={itemClasses} href={item.href} onClick={onClick}>
              {item.label}
            </a>
          );
        } else if (clickable) {
          itemNode = (
            <span className={itemClasses} role="link" tabIndex={0} onClick={onClick}>
              {item.label}
            </span>
          );
        } else {
          itemNode = <span className={itemClasses}>{item.label}</span>;
        }

        return (
          <Fragment key={item.key}>
            {itemNode}
            {!isLast ? (
              <span className="cx-ui-breadcrumb__separator" aria-hidden="true">
                {hasSeparatorSlot ? separatorNode : separator}
              </span>
            ) : null}
          </Fragment>
        );
      })}
    </nav>
  );
}
