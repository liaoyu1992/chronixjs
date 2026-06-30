import {
  defaultAnchorProps,
  ensureChronixAnchorStyles,
  resolveAnchorClassList,
  type AnchorItem,
  type AnchorProps,
} from '@chronixjs/ui';
import {
  useCallback,
  useEffect,
  useMemo,
  type HTMLAttributes,
  type MouseEvent as ReactMouseEvent,
} from 'react';

export interface ChronixAnchorProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  readonly items?: readonly AnchorItem[];
  readonly showRail?: boolean | undefined;
  readonly showBackground?: boolean | undefined;
  readonly bound?: number;
}

/**
 * `<ChronixAnchor>` — React 18 port of the Anchor.
 * Renders a vertical anchor navigation with optional rail and background.
 */
export function ChronixAnchor(props: ChronixAnchorProps): JSX.Element {
  const {
    items = defaultAnchorProps.items,
    showRail = defaultAnchorProps.showRail,
    showBackground = defaultAnchorProps.showBackground,
    bound: _bound = defaultAnchorProps.bound,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixAnchorStyles();
  }, []);

  const resolvedProps = useMemo<Pick<AnchorProps, 'showRail' | 'showBackground'>>(
    () => ({ showRail, showBackground }),
    [showRail, showBackground],
  );

  const classList = useMemo(() => resolveAnchorClassList(resolvedProps).join(' '), [resolvedProps]);

  const handleClick = useCallback((event: ReactMouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();
    const target = document.getElementById(href.replace(/^#/, ''));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <nav data-testid="anchor-root" className={classList} {...rest}>
      <div className="cx-ui-anchor__links">
        {items.map((item) => (
          <a
            key={item.key}
            className="cx-ui-anchor__link"
            href={item.href}
            onClick={(e) => handleClick(e, item.href)}
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
