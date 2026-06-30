import type { AlertProps } from './alert-spec.js';

/**
 * Compute class set for the Alert root element.
 *
 * .
 *
 * Class structure:
 *
 * - `'cx-ui-alert'` — always present.
 * - `'cx-ui-alert--{type}'` — drives bg + border + text color tokens.
 * - `'cx-ui-alert--closable'` — present iff `props.closable`. Drives
 *   padding-right reservation for the close button.
 * - `'cx-ui-alert--bordered'` — present iff `props.bordered`. Drives
 *   visible border-color.
 * - `'cx-ui-alert--with-title'` — present iff `props.title !== undefined`.
 *   Drives the title-row layout.
 */
export function resolveAlertClassList(props: AlertProps): string[] {
  const classes = ['cx-ui-alert', `cx-ui-alert--${props.type}`];
  if (props.closable) classes.push('cx-ui-alert--closable');
  if (props.bordered) classes.push('cx-ui-alert--bordered');
  if (props.title !== undefined) classes.push('cx-ui-alert--with-title');
  return classes;
}
