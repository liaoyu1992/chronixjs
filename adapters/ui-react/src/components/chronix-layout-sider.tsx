import {
  defaultLayoutSiderProps,
  ensureChronixLayoutStyles,
  getIcon,
  resolveBreakpointMediaQuery,
  resolveLayoutSiderClassList,
  resolveLayoutSiderWidthStyle,
  type LayoutSiderBreakpoint,
  type LayoutSiderPlacement,
} from '@chronixjs/ui';
import { useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react';

export interface ChronixLayoutSiderProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  readonly width?: number | string;
  readonly collapsedWidth?: number | string;
  readonly collapsed?: boolean;
  readonly collapsible?: boolean;
  readonly placement?: LayoutSiderPlacement;
  readonly breakpoint?: LayoutSiderBreakpoint | undefined;
  readonly children?: ReactNode;
  readonly onCollapsedChange?: (collapsed: boolean) => void;
}

export function ChronixLayoutSider(props: ChronixLayoutSiderProps): JSX.Element {
  const {
    width = defaultLayoutSiderProps.width,
    collapsedWidth = defaultLayoutSiderProps.collapsedWidth,
    collapsed = defaultLayoutSiderProps.collapsed,
    collapsible = defaultLayoutSiderProps.collapsible,
    placement = defaultLayoutSiderProps.placement,
    breakpoint = defaultLayoutSiderProps.breakpoint,
    children,
    onCollapsedChange,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixLayoutStyles();
  }, []);

  const onCollapsedChangeRef = useRef(onCollapsedChange);
  onCollapsedChangeRef.current = onCollapsedChange;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (breakpoint === undefined) return;
    const mql = window.matchMedia(resolveBreakpointMediaQuery(breakpoint));
    if (mql.matches !== collapsed) onCollapsedChangeRef.current?.(mql.matches);
    function handle(event: MediaQueryListEvent): void {
      onCollapsedChangeRef.current?.(event.matches);
    }
    mql.addEventListener('change', handle);
    return () => mql.removeEventListener('change', handle);
  }, [breakpoint, collapsed]);

  function handleTriggerClick(): void {
    onCollapsedChangeRef.current?.(!collapsed);
  }

  function renderTrigger(): ReactNode {
    const iconName =
      placement === 'left'
        ? collapsed
          ? 'chevron-right'
          : 'chevron-left'
        : collapsed
          ? 'chevron-left'
          : 'chevron-right';
    const iconSpec = getIcon(iconName);
    const icon = iconSpec ? (
      <svg viewBox={iconSpec.viewBox} width={16} height={16} fill="currentColor" aria-hidden="true">
        {iconSpec.paths.map((p, i) =>
          p.fillRule !== undefined ? (
            <path key={i} d={p.d} fillRule={p.fillRule} />
          ) : (
            <path key={i} d={p.d} />
          ),
        )}
      </svg>
    ) : (
      <span>›</span>
    );
    return (
      <button
        type="button"
        className="cx-ui-layout__sider-trigger"
        aria-label={collapsed ? 'Expand' : 'Collapse'}
        onClick={handleTriggerClick}
      >
        {icon}
      </button>
    );
  }

  const widthStyle = resolveLayoutSiderWidthStyle({
    collapsed,
    width,
    collapsedWidth,
  });
  const classes = resolveLayoutSiderClassList({
    collapsed,
    collapsible,
    placement,
  }).join(' ');

  return (
    <aside {...rest} className={classes} style={{ width: widthStyle, ...rest.style }}>
      <div className="cx-ui-layout__sider-content">{children}</div>
      {collapsible ? renderTrigger() : null}
    </aside>
  );
}
