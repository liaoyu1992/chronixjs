import type { FlexProps } from './flex-spec.js';

/**
 * Compute class set for the Flex root element.
 *
 * .
 *
 * Class structure:
 *
 * - `'cx-ui-flex'` — always present.
 * - `'cx-ui-flex--direction-{value}'` — drives flex-direction.
 * - `'cx-ui-flex--wrap-{value}'` — drives flex-wrap.
 * - `'cx-ui-flex--inline'` — present iff `props.inline` true.
 * - `'cx-ui-flex--align-{value}'` — present iff `props.align` is
 *   defined.
 * - `'cx-ui-flex--justify-{value}'` — present iff `props.justify`
 *   is defined.
 *
 * The gap is NOT encoded as a class — it is applied inline by the
 * adapter via `resolveFlexGap`.
 */
export function resolveFlexClassList(props: FlexProps): string[] {
  const classes = [
    'cx-ui-flex',
    `cx-ui-flex--direction-${props.direction}`,
    `cx-ui-flex--wrap-${props.wrap}`,
  ];
  if (props.inline) classes.push('cx-ui-flex--inline');
  if (props.align !== undefined) classes.push(`cx-ui-flex--align-${props.align}`);
  if (props.justify !== undefined) classes.push(`cx-ui-flex--justify-${props.justify}`);
  return classes;
}
