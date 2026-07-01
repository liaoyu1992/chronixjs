import {
  defaultCollapseProps,
  ensureChronixCollapseStyles,
  getIcon,
  isCollapseItemExpanded,
  resolveCollapseClassList,
  resolveCollapseItemClassList,
  toggleCollapseValue,
  type CollapseArrowPlacement,
  type CollapseItem,
} from '@chronixjs/ui';
import { useEffect, type HTMLAttributes } from 'react';

import { ChronixCollapseTransition } from './chronix-collapse-transition.js';

export interface ChronixCollapseProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onChange'
> {
  readonly value?: string | readonly string[];
  readonly items?: readonly CollapseItem[];
  readonly accordion?: boolean;
  readonly arrowPlacement?: CollapseArrowPlacement;
  readonly onValueChange?: (value: string | readonly string[] | undefined) => void;
  readonly onItemChange?: (key: string, expanded: boolean) => void;
}

export function ChronixCollapse(props: ChronixCollapseProps): React.ReactElement {
  const {
    value,
    items = defaultCollapseProps.items,
    accordion = defaultCollapseProps.accordion,
    arrowPlacement = defaultCollapseProps.arrowPlacement,
    onValueChange,
    onItemChange,
    ...rest
  } = props;
  useEffect(() => {
    ensureChronixCollapseStyles();
  }, []);

  function expandedSet(): ReadonlySet<string> {
    if (value === undefined) return new Set();
    if (typeof value === 'string') return new Set([value]);
    return new Set(value);
  }

  function toggle(item: CollapseItem): void {
    if (item.disabled) return;
    const currentExpanded = expandedSet();
    const next = toggleCollapseValue({
      currentExpanded,
      toggleKey: item.key,
      accordion,
      items,
    });
    onValueChange?.(next);
    onItemChange?.(item.key, !currentExpanded.has(item.key));
  }

  return (
    <div
      {...rest}
      className={resolveCollapseClassList({ arrowPlacement }).join(' ')}
      role="tablist"
    >
      {items.map((item) => {
        const expanded = isCollapseItemExpanded({ value, itemKey: item.key });
        const arrowIcon = getIcon('chevron-right');
        const arrow = arrowIcon ? (
          <svg
            viewBox={arrowIcon.viewBox}
            width={14}
            height={14}
            fill="currentColor"
            aria-hidden="true"
          >
            {arrowIcon.paths.map((p, i) =>
              p.fillRule !== undefined ? (
                <path key={i} d={p.d} fillRule={p.fillRule} />
              ) : (
                <path key={i} d={p.d} />
              ),
            )}
          </svg>
        ) : (
          <span>▶</span>
        );
        return (
          <div
            key={item.key}
            data-item-key={item.key}
            className={resolveCollapseItemClassList({
              expanded,
              disabled: item.disabled,
            }).join(' ')}
          >
            <button
              type="button"
              className="cx-ui-collapse__header"
              disabled={item.disabled}
              aria-expanded={expanded ? 'true' : 'false'}
              onClick={() => toggle(item)}
            >
              <span className="cx-ui-collapse__arrow">{arrow}</span>
              <span className="cx-ui-collapse__title">{item.title}</span>
            </button>
            <div className="cx-ui-collapse__body">
              <ChronixCollapseTransition show={expanded}>
                <div className="cx-ui-collapse__content">{item.content ?? ''}</div>
              </ChronixCollapseTransition>
            </div>
          </div>
        );
      })}
    </div>
  );
}
