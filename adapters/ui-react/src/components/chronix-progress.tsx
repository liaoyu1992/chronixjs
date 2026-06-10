import {
  defaultProgressProps,
  ensureChronixProgressStyles,
  formatProgressPercentage,
  resolveProgressClassList,
  type ProgressIndicatorPlacement,
  type ProgressType,
} from '@chronixjs/ui';
import { useEffect, useMemo, type CSSProperties, type HTMLAttributes } from 'react';

/**
 * Props for `<ChronixProgress>` in the React adapter. Mirrors the Vue
 * adapters' prop bag.
 */
export interface ChronixProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  readonly type?: ProgressType;
  readonly percentage?: number;
  readonly showInfo?: boolean;
  readonly height?: number | undefined;
  readonly indicatorPlacement?: ProgressIndicatorPlacement;
}

/**
 * `<ChronixProgress>` — React port of the Phase 16 Progress (line
 * variant). Verbatim surface mirror of the Vue adapters.
 */
export function ChronixProgress(props: ChronixProgressProps): JSX.Element {
  const {
    type = defaultProgressProps.type,
    percentage = defaultProgressProps.percentage,
    showInfo = defaultProgressProps.showInfo,
    height = defaultProgressProps.height,
    indicatorPlacement = defaultProgressProps.indicatorPlacement,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixProgressStyles();
  }, []);

  const resolvedProps = useMemo(
    () => ({ type, percentage, showInfo, height, indicatorPlacement }),
    [type, percentage, showInfo, height, indicatorPlacement],
  );

  const formatted = useMemo(
    () => formatProgressPercentage(resolvedProps.percentage),
    [resolvedProps.percentage],
  );

  const classList = useMemo(
    () => resolveProgressClassList(resolvedProps).join(' '),
    [resolvedProps],
  );

  const fillStyle: CSSProperties = { width: `${formatted.clamped}%` };
  const railStyle: CSSProperties = {};
  if (resolvedProps.height !== undefined) {
    railStyle.height = `${resolvedProps.height}px`;
  }

  const insideInfo =
    resolvedProps.showInfo && resolvedProps.indicatorPlacement === 'inside' ? (
      <div className="cx-ui-progress__info">{formatted.display}</div>
    ) : null;
  const outsideInfo =
    resolvedProps.showInfo && resolvedProps.indicatorPlacement === 'outside' ? (
      <div className="cx-ui-progress__info">{formatted.display}</div>
    ) : null;

  return (
    <div {...rest} className={classList}>
      <div className="cx-ui-progress__rail" style={railStyle}>
        <div className="cx-ui-progress__fill" style={fillStyle} />
        {insideInfo}
      </div>
      {outsideInfo}
    </div>
  );
}
