import {
  PAGE_HEADER_BACK_ICON_PLACEHOLDER,
  defaultPageHeaderProps,
  ensureChronixPageHeaderStyles,
  resolvePageHeaderClassList,
} from '@chronixjs/ui';
import { useEffect, useMemo, type HTMLAttributes, type ReactNode } from 'react';

export interface ChronixPageHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Heading text. Override via the `titleNode` ReactNode prop. */
  readonly title?: string | undefined;
  /** Sub-heading text. Override via the `subtitleNode` ReactNode prop. */
  readonly subtitle?: string | undefined;
  /** When true, renders the back affordance + emits `onBack` on click. */
  readonly back?: boolean;
  /** When true, applies the inverted (dark-surface) theme tokens. */
  readonly inverted?: boolean;
  /** Custom node for the back-button content; defaults to unicode `←`. */
  readonly backIcon?: ReactNode;
  /** Avatar slot (left of heading). */
  readonly avatar?: ReactNode;
  /** Rich title node; overrides the `title` string when supplied. */
  readonly titleNode?: ReactNode;
  /** Rich subtitle node; overrides the `subtitle` string when supplied. */
  readonly subtitleNode?: ReactNode;
  /** Right-aligned action area. */
  readonly extra?: ReactNode;
  /** Footer slot (tabs / descriptions / etc.). */
  readonly footer?: ReactNode;
  /** Main content rendered below the heading row, above the footer. */
  readonly children?: ReactNode;
  /** Fires when the back button is clicked. */
  readonly onBack?: () => void;
}

/**
 * `<ChronixPageHeader>` — React port of the Phase 19 PageHeader.
 */
export function ChronixPageHeader(props: ChronixPageHeaderProps): JSX.Element {
  const {
    title = defaultPageHeaderProps.title,
    subtitle = defaultPageHeaderProps.subtitle,
    back = defaultPageHeaderProps.back,
    inverted = defaultPageHeaderProps.inverted,
    backIcon,
    avatar,
    titleNode,
    subtitleNode,
    extra,
    footer,
    children,
    onBack,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixPageHeaderStyles();
  }, []);

  const hasAvatar = avatar !== undefined && avatar !== null;
  const hasTitle = titleNode !== undefined && titleNode !== null ? true : title !== undefined;
  const hasSubtitle =
    subtitleNode !== undefined && subtitleNode !== null ? true : subtitle !== undefined;
  const hasExtra = extra !== undefined && extra !== null;
  const hasFooter = footer !== undefined && footer !== null;
  const hasContent = children !== undefined && children !== null;

  const classList = useMemo(
    () =>
      resolvePageHeaderClassList({
        props: { title, subtitle, back, inverted },
        hasTitle,
        hasSubtitle,
        hasAvatar,
        hasExtra,
        hasFooter,
        hasContent,
      }).join(' '),
    [
      title,
      subtitle,
      back,
      inverted,
      hasTitle,
      hasSubtitle,
      hasAvatar,
      hasExtra,
      hasFooter,
      hasContent,
    ],
  );

  const titleContent = titleNode ?? title;
  const subtitleContent = subtitleNode ?? subtitle;
  const backContent = backIcon ?? PAGE_HEADER_BACK_ICON_PLACEHOLDER;

  return (
    <div {...rest} className={classList}>
      <div className="cx-ui-page-header__main">
        {back ? (
          <button
            type="button"
            className="cx-ui-page-header__back-button"
            aria-label="Back"
            onClick={onBack}
          >
            {backContent}
          </button>
        ) : null}
        {hasAvatar ? <div className="cx-ui-page-header__avatar">{avatar}</div> : null}
        {hasTitle || hasSubtitle ? (
          <div className="cx-ui-page-header__heading">
            {hasTitle ? <div className="cx-ui-page-header__title">{titleContent}</div> : null}
            {hasSubtitle ? (
              <div className="cx-ui-page-header__subtitle">{subtitleContent}</div>
            ) : null}
          </div>
        ) : null}
        {hasExtra ? <div className="cx-ui-page-header__extra">{extra}</div> : null}
      </div>
      {hasContent ? <div className="cx-ui-page-header__content">{children}</div> : null}
      {hasFooter ? <div className="cx-ui-page-header__footer">{footer}</div> : null}
    </div>
  );
}
