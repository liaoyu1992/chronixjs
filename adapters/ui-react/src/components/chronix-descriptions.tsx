import {
  defaultDescriptionsProps,
  ensureChronixDescriptionsStyles,
  resolveDescriptionItemSpanStyle,
  resolveDescriptionsClassList,
  resolveDescriptionsGridTemplateColumns,
  type DescriptionItem,
  type DescriptionsLabelPlacement,
  type DescriptionsSize,
} from '@chronixjs/ui';
import { useEffect, useMemo, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';

export interface ChronixDescriptionsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly items?: readonly DescriptionItem[];
  readonly columns?: number;
  readonly bordered?: boolean;
  readonly labelPlacement?: DescriptionsLabelPlacement;
  readonly size?: DescriptionsSize;
  /** Header title text. Override via the `titleNode` ReactNode prop. */
  readonly title?: string | undefined;
  /** Rich title content; overrides the `title` string when supplied. */
  readonly titleNode?: ReactNode;
}

/**
 * `<ChronixDescriptions>` — React port of the Descriptions.
 *
 * Root element is `<div>`. The native `title` HTML attribute is
 * shadowed by the chronix prop (`Omit<HTMLAttributes, 'title'>`);
 * pass-through HTML attributes via spread otherwise.
 */
export function ChronixDescriptions(props: ChronixDescriptionsProps): React.ReactElement {
  const {
    items = defaultDescriptionsProps.items,
    columns = defaultDescriptionsProps.columns,
    bordered = defaultDescriptionsProps.bordered,
    labelPlacement = defaultDescriptionsProps.labelPlacement,
    size = defaultDescriptionsProps.size,
    title = defaultDescriptionsProps.title,
    titleNode,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixDescriptionsStyles();
  }, []);

  const hasTitle = titleNode !== undefined && titleNode !== null ? true : title !== undefined;

  const classList = useMemo(
    () =>
      resolveDescriptionsClassList({
        props: { items, columns, bordered, labelPlacement, size, title },
        hasTitle,
      }).join(' '),
    [items, columns, bordered, labelPlacement, size, title, hasTitle],
  );

  const gridStyle = useMemo<CSSProperties>(
    () => ({
      gridTemplateColumns: resolveDescriptionsGridTemplateColumns(columns),
    }),
    [columns],
  );

  const titleContent = titleNode ?? title;

  return (
    <div {...rest} className={classList}>
      {hasTitle ? <div className="cx-ui-descriptions__title">{titleContent}</div> : null}
      <div className="cx-ui-descriptions__grid" style={gridStyle}>
        {items.map((item) => {
          const spanStyle = resolveDescriptionItemSpanStyle(item, columns);
          return (
            <div key={item.key} className="cx-ui-descriptions__item" style={spanStyle}>
              <div className="cx-ui-descriptions__label">{item.label}</div>
              <div className="cx-ui-descriptions__value">{item.value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
