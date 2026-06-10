import {
  defaultStepsProps,
  deriveStepItemStatus,
  ensureChronixStepsStyles,
  getStepIndicatorContent,
  resolveStepItemClassList,
  resolveStepsClassList,
  type StepItem,
  type StepsDirection,
} from '@chronixjs/ui';
import { Fragment, useEffect, useMemo, type HTMLAttributes } from 'react';

export interface ChronixStepsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  readonly items?: readonly StepItem[];
  readonly current?: number;
  readonly direction?: StepsDirection;
}

/**
 * `<ChronixSteps>` — React port of the Phase 20 Steps.
 */
export function ChronixSteps(props: ChronixStepsProps): JSX.Element {
  const {
    items = defaultStepsProps.items,
    current = defaultStepsProps.current,
    direction = defaultStepsProps.direction,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixStepsStyles();
  }, []);

  const classList = useMemo(
    () => resolveStepsClassList({ items, current, direction }).join(' '),
    [items, current, direction],
  );

  return (
    <div {...rest} className={classList}>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const isCurrent = idx === current;
        const derivedStatus = deriveStepItemStatus(item, idx, current);
        const itemClasses = resolveStepItemClassList(derivedStatus, isCurrent).join(' ');
        const indicatorContent = getStepIndicatorContent(derivedStatus, idx);

        return (
          <Fragment key={item.key}>
            <div className={itemClasses}>
              <div className="cx-ui-steps__indicator">
                <span className="cx-ui-steps__index" aria-hidden="true">
                  {indicatorContent}
                </span>
              </div>
              <div className="cx-ui-steps__content">
                <div className="cx-ui-steps__title">{item.title}</div>
                {item.description !== undefined ? (
                  <div className="cx-ui-steps__description">{item.description}</div>
                ) : null}
              </div>
            </div>
            {!isLast ? <div className="cx-ui-steps__separator" aria-hidden="true" /> : null}
          </Fragment>
        );
      })}
    </div>
  );
}
