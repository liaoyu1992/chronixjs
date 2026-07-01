import { defaultThingProps, ensureChronixThingStyles, resolveThingClassList } from '@chronixjs/ui';
import { useEffect, useMemo, type HTMLAttributes, type ReactNode } from 'react';

export interface ChronixThingProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Header text. Override via the `headerNode` ReactNode prop. */
  readonly title?: string | undefined;
  /** Description text. Override via the `descriptionNode` ReactNode prop. */
  readonly description?: string | undefined;
  /** Indents `__content` to align past the avatar column. */
  readonly contentIndented?: boolean;
  /** Avatar slot (left of main). */
  readonly avatar?: ReactNode;
  /** Rich header node; overrides `title` string when supplied. */
  readonly headerNode?: ReactNode;
  /** Right-aligned content within the header row. */
  readonly headerExtra?: ReactNode;
  /** Rich description node; overrides `description` string when supplied. */
  readonly descriptionNode?: ReactNode;
  /** Action / interaction row. */
  readonly action?: ReactNode;
  /** Footer / meta-info row at the bottom. */
  readonly footer?: ReactNode;
  /** Main content rendered between description and action. */
  readonly children?: ReactNode;
}

/**
 * `<ChronixThing>` — React port of the Thing.
 *
 * Props type extends `Omit<HTMLAttributes<HTMLDivElement>, 'title'>`
 * — the native `title` HTML attribute is shadowed by the chronix
 * `title` string prop. Rich-content alternative names (`headerNode`
 * / `descriptionNode`) mirror PageHeader's slot-equivalent
 * convention.
 */
export function ChronixThing(props: ChronixThingProps): React.ReactElement {
  const {
    title = defaultThingProps.title,
    description = defaultThingProps.description,
    contentIndented = defaultThingProps.contentIndented,
    avatar,
    headerNode,
    headerExtra,
    descriptionNode,
    action,
    footer,
    children,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixThingStyles();
  }, []);

  const hasAvatar = avatar !== undefined && avatar !== null;
  const hasHeader = headerNode !== undefined && headerNode !== null ? true : title !== undefined;
  const hasHeaderExtra = headerExtra !== undefined && headerExtra !== null;
  const hasDescription =
    descriptionNode !== undefined && descriptionNode !== null ? true : description !== undefined;
  const hasContent = children !== undefined && children !== null;
  const hasAction = action !== undefined && action !== null;
  const hasFooter = footer !== undefined && footer !== null;

  const classList = useMemo(
    () =>
      resolveThingClassList({
        props: { title, description, contentIndented },
        hasAvatar,
        hasHeader,
        hasHeaderExtra,
        hasDescription,
        hasContent,
        hasAction,
        hasFooter,
      }).join(' '),
    [
      title,
      description,
      contentIndented,
      hasAvatar,
      hasHeader,
      hasHeaderExtra,
      hasDescription,
      hasContent,
      hasAction,
      hasFooter,
    ],
  );

  const headerContent = headerNode ?? title;
  const descriptionContent = descriptionNode ?? description;

  return (
    <div {...rest} className={classList}>
      {hasAvatar ? <div className="cx-ui-thing__avatar">{avatar}</div> : null}
      <div className="cx-ui-thing__main">
        {hasHeader || hasHeaderExtra ? (
          <div className="cx-ui-thing__header">
            {hasHeader ? <div className="cx-ui-thing__header-content">{headerContent}</div> : null}
            {hasHeaderExtra ? <div className="cx-ui-thing__header-extra">{headerExtra}</div> : null}
          </div>
        ) : null}
        {hasDescription ? (
          <div className="cx-ui-thing__description">{descriptionContent}</div>
        ) : null}
        {hasContent ? <div className="cx-ui-thing__content">{children}</div> : null}
        {hasAction ? <div className="cx-ui-thing__action">{action}</div> : null}
        {hasFooter ? <div className="cx-ui-thing__footer">{footer}</div> : null}
      </div>
    </div>
  );
}
