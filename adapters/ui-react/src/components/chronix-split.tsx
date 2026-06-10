import {
  clampSplitSize,
  defaultSplitProps,
  ensureChronixSplitStyles,
  resolveSplitClassList,
  resolveSplitFirstPaneStyle,
  resolveSplitSizePx,
  type SplitDirection,
} from '@chronixjs/ui';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';

export interface ChronixSplitProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  readonly direction?: SplitDirection;
  readonly defaultSize?: number | string;
  readonly size?: number | string;
  readonly minSize?: number | string;
  readonly maxSize?: number | string;
  readonly disabled?: boolean;
  readonly first?: ReactNode;
  readonly second?: ReactNode;
  readonly onSizeChange?: (size: number | string) => void;
  readonly onResizeStart?: () => void;
  readonly onResizeEnd?: () => void;
}

export function ChronixSplit(props: ChronixSplitProps): JSX.Element {
  const {
    direction = defaultSplitProps.direction,
    defaultSize = defaultSplitProps.defaultSize,
    size: controlledSize,
    minSize = defaultSplitProps.minSize,
    maxSize = defaultSplitProps.maxSize,
    disabled = defaultSplitProps.disabled,
    first,
    second,
    onSizeChange,
    onResizeStart,
    onResizeEnd,
    ...rest
  } = props;
  useEffect(() => {
    ensureChronixSplitStyles();
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const [internalSize, setInternalSize] = useState<number | string>(defaultSize);
  const activePointerIdRef = useRef<number | null>(null);
  const activeBarRef = useRef<HTMLElement | null>(null);
  const onSizeChangeRef = useRef(onSizeChange);
  const onResizeEndRef = useRef(onResizeEnd);
  onSizeChangeRef.current = onSizeChange;
  onResizeEndRef.current = onResizeEnd;

  const currentSize = controlledSize ?? internalSize;

  const containerLengthPx = useCallback((): number => {
    const el = containerRef.current;
    if (el === null) return 0;
    const rect = el.getBoundingClientRect();
    return direction === 'horizontal' ? rect.width : rect.height;
  }, [direction]);

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      if (activePointerIdRef.current !== event.pointerId) return;
      const el = containerRef.current;
      if (el === null) return;
      const rect = el.getBoundingClientRect();
      const lengthPx = containerLengthPx();
      const proposedPx =
        direction === 'horizontal' ? event.clientX - rect.left : event.clientY - rect.top;
      const clamped = clampSplitSize({
        proposedPx,
        minSize,
        maxSize,
        containerLengthPx: lengthPx,
      });
      const nextSize = `${clamped}px`;
      if (controlledSize === undefined) setInternalSize(nextSize);
      onSizeChangeRef.current?.(nextSize);
    },
    [containerLengthPx, controlledSize, direction, maxSize, minSize],
  );

  const onPointerUp = useCallback(
    (event: PointerEvent) => {
      if (activePointerIdRef.current !== event.pointerId) return;
      const bar = activeBarRef.current;
      if (bar !== null && typeof bar.releasePointerCapture === 'function') {
        try {
          bar.releasePointerCapture(event.pointerId);
        } catch {
          /* ignore */
        }
      }
      activePointerIdRef.current = null;
      activeBarRef.current = null;
      onResizeEndRef.current?.();
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
    },
    [onPointerMove],
  );

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>): void {
    if (disabled) return;
    activePointerIdRef.current = event.pointerId;
    activeBarRef.current = event.currentTarget;
    if (typeof event.currentTarget.setPointerCapture === 'function') {
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
    }
    onResizeStart?.();
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
  }

  useEffect(() => {
    return () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  const lengthPx = containerLengthPx();
  const resolvedPx = resolveSplitSizePx({
    value: currentSize,
    containerLengthPx: lengthPx,
  });
  const paneStyle = resolveSplitFirstPaneStyle({
    size: resolvedPx ?? currentSize,
  });

  return (
    <div
      {...rest}
      ref={containerRef}
      className={resolveSplitClassList({ direction, disabled }).join(' ')}
    >
      <div className="cx-ui-split__pane cx-ui-split__pane--first" style={paneStyle}>
        {first}
      </div>
      <div
        className="cx-ui-split__bar"
        role="separator"
        aria-orientation={direction === 'horizontal' ? 'vertical' : 'horizontal'}
        tabIndex={disabled ? -1 : 0}
        onPointerDown={onPointerDown}
      />
      <div className="cx-ui-split__pane cx-ui-split__pane--second">{second}</div>
    </div>
  );
}
