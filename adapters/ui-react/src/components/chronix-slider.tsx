import {
  computeSliderMarks,
  defaultSliderProps,
  ensureChronixSliderStyles,
  resolveSliderMarkClassList,
  resolveSliderRootClassList,
  resolveSliderThumbClassList,
  type SliderMark,
} from '@chronixjs/ui';
import { useCallback, useEffect, useMemo, useRef, useState, type HTMLAttributes } from 'react';

export interface ChronixSliderProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onChange'
> {
  readonly value?: number;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly disabled?: boolean | undefined;
  readonly marks?: Readonly<Record<number, SliderMark>> | undefined;
  readonly tooltip?: boolean | undefined;
  readonly onChange?: (value: number) => void;
}

export function ChronixSlider(props: ChronixSliderProps): JSX.Element {
  const {
    value = defaultSliderProps.value as number,
    min = defaultSliderProps.min,
    max = defaultSliderProps.max,
    step = defaultSliderProps.step,
    disabled = defaultSliderProps.disabled,
    marks: marksProp,
    tooltip = defaultSliderProps.tooltip,
    onChange,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixSliderStyles();
  }, []);

  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const rootClassName = useMemo(
    () => resolveSliderRootClassList({ disabled: disabled ?? false, vertical: false }).join(' '),
    [disabled],
  );

  const thumbClassName = useMemo(
    () => resolveSliderThumbClassList({ dragging }).join(' '),
    [dragging],
  );

  const computedMarks = useMemo(
    () => computeSliderMarks(marksProp ?? {}, min, max),
    [marksProp, min, max],
  );

  const ratio = useMemo(() => {
    const range = max - min;
    if (range <= 0) return 0;
    return ((value - min) / range) * 100;
  }, [value, min, max]);

  const clampValue = useCallback(
    (v: number): number => {
      const clamped = Math.max(min, Math.min(max, v));
      if (step > 0) {
        const snapped = Math.round((clamped - min) / step) * step + min;
        return Math.max(min, Math.min(max, snapped));
      }
      return clamped;
    },
    [min, max, step],
  );

  const handleTrackClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      const raw = min + pct * (max - min);
      onChange?.(clampValue(raw));
    },
    [disabled, min, max, clampValue, onChange],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.preventDefault();
      setDragging(true);

      const onMove = (ev: PointerEvent) => {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        const pct = (ev.clientX - rect.left) / rect.width;
        const raw = min + pct * (max - min);
        onChange?.(clampValue(raw));
      };

      const onUp = () => {
        setDragging(false);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [disabled, min, max, clampValue, onChange],
  );

  const markNodes = computedMarks.map((mark) => (
    <div
      key={`mark-${mark.value}`}
      className={resolveSliderMarkClassList({ active: mark.value <= value }).join(' ')}
      style={{ left: `${mark.percent}%` }}
      data-testid={`slider-mark-${mark.value}`}
    >
      <span className="cx-ui-slider__mark-label">{mark.label}</span>
    </div>
  ));

  return (
    <div {...rest} className={rootClassName} data-testid="slider-root">
      <div
        className="cx-ui-slider__track"
        ref={trackRef}
        onClick={handleTrackClick}
        data-testid="slider-track"
      >
        <div className="cx-ui-slider__fill" style={{ width: `${ratio}%` }} />
        <div
          className={thumbClassName}
          style={{ left: `${ratio}%` }}
          onPointerDown={handlePointerDown}
          data-testid="slider-thumb"
          role="slider"
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? -1 : 0}
        >
          {tooltip && (
            <span className="cx-ui-slider__tooltip" data-testid="slider-tooltip">
              {value}
            </span>
          )}
        </div>
      </div>
      {computedMarks.length > 0 && <div className="cx-ui-slider__marks">{markNodes}</div>}
    </div>
  );
}
