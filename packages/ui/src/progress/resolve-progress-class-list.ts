import type { ProgressProps } from './progress-spec.js';

/**
 * Compute class set for the Progress root element.
 *
 * .
 *
 * Class structure:
 *
 * - `'cx-ui-progress'` — always present.
 * - `'cx-ui-progress--{type}'` — `default` / `success` / `warning` /
 *   `error` / `info`. Drives `__fill` bg color.
 * - `'cx-ui-progress--with-info'` — present iff `props.showInfo` true.
 *   Controls visibility of the `__info` element.
 * - `'cx-ui-progress--info-{placement}'` — only present when
 *   `showInfo` is true; `inside` or `outside`. Controls whether the
 *   percentage text overlays the fill bar or appends after the rail.
 */
export function resolveProgressClassList(props: ProgressProps): string[] {
  const classes = ['cx-ui-progress', `cx-ui-progress--${props.type}`];
  if (props.showInfo) {
    classes.push('cx-ui-progress--with-info');
    classes.push(`cx-ui-progress--info-${props.indicatorPlacement}`);
  }
  return classes;
}
