import {
  defaultTimelineProps,
  ensureChronixTimelineStyles,
  resolveTimelineClassList,
  resolveTimelineItemClassList,
  type TimelineItem,
} from '@chronixjs/ui';
import { useEffect, useMemo, type HTMLAttributes } from 'react';

export interface ChronixTimelineProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  readonly items?: readonly TimelineItem[];
}

/**
 * `<ChronixTimeline>` — React port of the Timeline.
 */
export function ChronixTimeline(props: ChronixTimelineProps): React.ReactElement {
  const { items = defaultTimelineProps.items, ...rest } = props;

  useEffect(() => {
    ensureChronixTimelineStyles();
  }, []);

  const classList = useMemo(() => resolveTimelineClassList({ items }).join(' '), [items]);

  return (
    <div {...rest} className={classList}>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const itemClasses = resolveTimelineItemClassList(item, isLast).join(' ');

        return (
          <div key={item.key} className={itemClasses}>
            <div className="cx-ui-timeline__indicator">
              <div className="cx-ui-timeline__dot" />
              {!isLast ? <div className="cx-ui-timeline__line" /> : null}
            </div>
            <div className="cx-ui-timeline__content">
              <div className="cx-ui-timeline__title">{item.title}</div>
              {item.description !== undefined ? (
                <div className="cx-ui-timeline__description">{item.description}</div>
              ) : null}
              {item.timestamp !== undefined ? (
                <div className="cx-ui-timeline__timestamp">{item.timestamp}</div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
