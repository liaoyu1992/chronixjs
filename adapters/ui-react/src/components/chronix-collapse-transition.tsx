import {
  buildHeightCollapseTransitionStyles,
  defaultCollapseTransitionProps,
  ensureChronixCollapseTransitionStyles,
  resolveCollapseTransitionClassList,
} from '@chronixjs/ui';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

export interface ChronixCollapseTransitionProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  readonly show: boolean;
  readonly duration?: number;
  readonly children?: ReactNode;
}

export function ChronixCollapseTransition(props: ChronixCollapseTransitionProps): JSX.Element {
  const { show, duration = defaultCollapseTransitionProps.duration, children, ...rest } = props;
  useEffect(() => {
    ensureChronixCollapseTransitionStyles();
  }, []);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [innerStyle, setInnerStyle] = useState<CSSProperties>(
    show ? { overflow: 'hidden' } : { height: '0px', overflow: 'hidden' },
  );
  const previousShowRef = useRef(show);

  useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (el === null) return;
    if (previousShowRef.current === show) {
      // Initial mount only: snap to final state.
      if (show) {
        setInnerStyle({ height: `${el.scrollHeight}px`, overflow: 'hidden' });
      } else {
        setInnerStyle({ height: '0px', overflow: 'hidden' });
      }
      return;
    }
    const scrollHeightPx = el.scrollHeight;
    const phases = buildHeightCollapseTransitionStyles({
      scrollHeightPx,
      spec: {
        durationMs: duration,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        delayMs: 0,
      },
    });
    if (show) {
      setInnerStyle(phases.enterFromStyle);
      const raf = requestAnimationFrame(() => {
        setInnerStyle({ ...phases.enterActiveStyle, ...phases.enterToStyle });
      });
      previousShowRef.current = show;
      return () => cancelAnimationFrame(raf);
    } else {
      setInnerStyle(phases.leaveFromStyle);
      const raf = requestAnimationFrame(() => {
        setInnerStyle({ ...phases.leaveActiveStyle, ...phases.leaveToStyle });
      });
      previousShowRef.current = show;
      return () => cancelAnimationFrame(raf);
    }
  }, [show, duration]);

  return (
    <div
      {...rest}
      ref={wrapperRef}
      className={resolveCollapseTransitionClassList({ show }).join(' ')}
      style={innerStyle}
    >
      {children}
    </div>
  );
}
