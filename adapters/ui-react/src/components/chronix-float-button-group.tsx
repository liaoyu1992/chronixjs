import {
  DEFAULT_HOVER_ENTER_DELAY_MS,
  DEFAULT_HOVER_LEAVE_DELAY_MS,
  defaultFloatButtonGroupProps,
  ensureChronixFloatButtonGroupStyles,
  getIcon,
  resolveFloatButtonGroupClassList,
  resolveFloatButtonPositionStyle,
  type FloatButtonGroupTrigger,
  type FloatButtonShape,
} from '@chronixjs/ui';
import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';

export interface ChronixFloatButtonGroupProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  readonly shape?: FloatButtonShape;
  readonly trigger?: FloatButtonGroupTrigger;
  readonly right?: number;
  readonly bottom?: number;
  readonly top?: number;
  readonly left?: number;
  readonly description?: string;
  readonly children?: ReactNode;
  readonly onExpandedChange?: (expanded: boolean) => void;
}

export function ChronixFloatButtonGroup(props: ChronixFloatButtonGroupProps): JSX.Element {
  const {
    shape = defaultFloatButtonGroupProps.shape,
    trigger,
    right = defaultFloatButtonGroupProps.right,
    bottom = defaultFloatButtonGroupProps.bottom,
    top,
    left,
    description,
    children,
    onExpandedChange,
    ...rest
  } = props;
  useEffect(() => {
    ensureChronixFloatButtonGroupStyles();
  }, []);

  const [expanded, setExpanded] = useState(trigger === undefined);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onExpandedChangeRef = useRef(onExpandedChange);
  onExpandedChangeRef.current = onExpandedChange;

  function clearHoverTimer(): void {
    if (hoverTimerRef.current !== null) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }

  function setExpandedValue(next: boolean): void {
    setExpanded((prev) => {
      if (prev === next) return prev;
      onExpandedChangeRef.current?.(next);
      return next;
    });
  }

  function onMainClick(): void {
    if (trigger !== 'click') return;
    setExpandedValue(!expanded);
  }

  function onMouseEnter(): void {
    if (trigger !== 'hover') return;
    clearHoverTimer();
    hoverTimerRef.current = setTimeout(() => setExpandedValue(true), DEFAULT_HOVER_ENTER_DELAY_MS);
  }

  function onMouseLeave(): void {
    if (trigger !== 'hover') return;
    clearHoverTimer();
    hoverTimerRef.current = setTimeout(() => setExpandedValue(false), DEFAULT_HOVER_LEAVE_DELAY_MS);
  }

  useEffect(() => {
    return () => clearHoverTimer();
  }, []);

  const positionStyle = resolveFloatButtonPositionStyle({
    right,
    bottom,
    top,
    left,
  });
  const classes = resolveFloatButtonGroupClassList({
    shape,
    trigger,
    expanded,
  }).join(' ');

  const plusIcon = getIcon('close');
  const triggerIcon = plusIcon ? (
    <svg
      viewBox={plusIcon.viewBox}
      width={18}
      height={18}
      fill="currentColor"
      aria-hidden="true"
      style={{ transform: expanded ? 'rotate(45deg)' : 'rotate(0deg)' }}
    >
      {plusIcon.paths.map((p, i) =>
        p.fillRule !== undefined ? (
          <path key={i} d={p.d} fillRule={p.fillRule} />
        ) : (
          <path key={i} d={p.d} />
        ),
      )}
    </svg>
  ) : (
    <span>{expanded ? '×' : '+'}</span>
  );

  return (
    <div
      {...rest}
      className={classes}
      style={positionStyle}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="cx-ui-float-button-group__children">{children}</div>
      {trigger !== undefined ? (
        <button
          type="button"
          className={`cx-ui-float-button cx-ui-float-button--shape-${shape} cx-ui-float-button--type-default cx-ui-float-button-group__trigger`}
          aria-expanded={expanded ? 'true' : 'false'}
          onClick={onMainClick}
        >
          <span className="cx-ui-float-button__icon">{triggerIcon}</span>
          {description !== undefined ? (
            <span className="cx-ui-float-button__description">{description}</span>
          ) : null}
        </button>
      ) : null}
    </div>
  );
}
