import {
  defaultBackTopProps,
  ensureChronixBackTopStyles,
  getIcon,
  resolveBackTopClassList,
  resolveBackTopStyle,
  shouldShowBackTop,
  type BackTopBehavior,
} from '@chronixjs/ui';
import {
  useCallback,
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';

export interface ChronixBackTopProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick' | 'children'
> {
  readonly visibilityThreshold?: number;
  readonly right?: number;
  readonly bottom?: number;
  readonly behavior?: BackTopBehavior;
  readonly children?: ReactNode;
  readonly onClick?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
}

export function ChronixBackTop(props: ChronixBackTopProps): JSX.Element | null {
  const {
    visibilityThreshold = defaultBackTopProps.visibilityThreshold,
    right = defaultBackTopProps.right,
    bottom = defaultBackTopProps.bottom,
    behavior = defaultBackTopProps.behavior,
    children,
    onClick,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixBackTopStyles();
  }, []);

  const [visible, setVisible] = useState(false);

  const recompute = useCallback(() => {
    if (typeof window === 'undefined') return;
    setVisible(shouldShowBackTop({ scrollY: window.scrollY, visibilityThreshold }));
  }, [visibilityThreshold]);

  useEffect(() => {
    recompute();
    if (typeof window === 'undefined') return;
    const opts: AddEventListenerOptions = { passive: true };
    window.addEventListener('scroll', recompute, opts);
    window.addEventListener('resize', recompute);
    return () => {
      window.removeEventListener('scroll', recompute);
      window.removeEventListener('resize', recompute);
    };
  }, [recompute]);

  function handleClick(event: ReactMouseEvent<HTMLButtonElement>): void {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, behavior });
  }

  if (!visible) return null;

  const iconSpec = getIcon('chevron-up');
  const iconNode: ReactNode =
    children !== undefined ? (
      <span className="cx-ui-back-top__icon">{children}</span>
    ) : (
      <span className="cx-ui-back-top__icon">
        {iconSpec !== undefined ? (
          <svg
            viewBox={iconSpec.viewBox}
            width={18}
            height={18}
            fill="currentColor"
            aria-hidden="true"
          >
            {iconSpec.paths.map((p, i) => (
              <path
                key={i}
                d={p.d}
                {...(p.fillRule !== undefined ? { fillRule: p.fillRule } : {})}
              />
            ))}
          </svg>
        ) : (
          '↑'
        )}
      </span>
    );

  return (
    <button
      {...rest}
      type="button"
      className={resolveBackTopClassList({ visible }).join(' ')}
      style={resolveBackTopStyle({ right, bottom })}
      onClick={handleClick}
    >
      {iconNode}
    </button>
  );
}
