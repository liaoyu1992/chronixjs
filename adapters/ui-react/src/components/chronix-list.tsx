import {
  defaultListProps,
  ensureChronixListStyles,
  resolveListClassList,
  resolveListItemClassList,
  type ListItem,
  type ListSize,
} from '@chronixjs/ui';
import { useEffect, useMemo, type HTMLAttributes } from 'react';

export interface ChronixListProps extends Omit<HTMLAttributes<HTMLUListElement>, 'children'> {
  readonly items?: readonly ListItem[];
  readonly bordered?: boolean;
  readonly hoverable?: boolean;
  readonly showDivider?: boolean;
  readonly size?: ListSize;
}

/**
 * `<ChronixList>` — React port of the Phase 21 List.
 *
 * Root element is `<ul>` (not `<div>`); items are `<li>`. The
 * props extend `Omit<HTMLAttributes<HTMLUListElement>, 'children'>`
 * — NEW for Phase 21 (Breadcrumb's `HTMLElement` precedent for
 * `<nav>` is the closest sibling).
 */
export function ChronixList(props: ChronixListProps): JSX.Element {
  const {
    items = defaultListProps.items,
    bordered = defaultListProps.bordered,
    hoverable = defaultListProps.hoverable,
    showDivider = defaultListProps.showDivider,
    size = defaultListProps.size,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixListStyles();
  }, []);

  const classList = useMemo(
    () =>
      resolveListClassList({
        items,
        bordered,
        hoverable,
        showDivider,
        size,
      }).join(' '),
    [items, bordered, hoverable, showDivider, size],
  );

  return (
    <ul {...rest} className={classList}>
      {items.map((item) => {
        const itemClasses = resolveListItemClassList(item).join(' ');
        return (
          <li key={item.key} className={itemClasses}>
            {item.prefix !== undefined ? (
              <div className="cx-ui-list__prefix">{item.prefix}</div>
            ) : null}
            <div className="cx-ui-list__main">
              <div className="cx-ui-list__title">{item.title}</div>
              {item.description !== undefined ? (
                <div className="cx-ui-list__description">{item.description}</div>
              ) : null}
            </div>
            {item.suffix !== undefined ? (
              <div className="cx-ui-list__suffix">{item.suffix}</div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
