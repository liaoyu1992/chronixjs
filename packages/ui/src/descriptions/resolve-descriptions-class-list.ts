import type { DescriptionsProps } from './descriptions-spec.js';

/**
 * Input bag for {@link resolveDescriptionsClassList}.
 *
 * Bundles the IR props with the adapter-derived `hasTitle`
 * boolean (computed from
 * `(titleSlot ? titleSlotNodes.length > 0 : false) || props.title
 * !== undefined`). The bag shape parallels
 * `PageHeaderClassListInput` — the adapter computes its booleans
 * once + hands them to the pure helper for class-list
 * derivation.
 */
export interface DescriptionsClassListInput {
  readonly props: DescriptionsProps;
  readonly hasTitle: boolean;
}

/**
 * Compute class set for the Descriptions root element.
 *
 * .
 *
 * Class structure:
 *
 * - `'cx-ui-descriptions'` — always present.
 * - `'cx-ui-descriptions--{size}'` — one of `'small' | 'medium' |
 *   'large'`.
 * - `'cx-ui-descriptions--placement-{left|top}'` — label position.
 * - `'cx-ui-descriptions--bordered'` — only when `props.bordered`.
 * - `'cx-ui-descriptions--with-title'` — only when `hasTitle`
 *   (prop string OR slot supplied).
 */
export function resolveDescriptionsClassList(input: DescriptionsClassListInput): string[] {
  const { props, hasTitle } = input;
  const classes = [
    'cx-ui-descriptions',
    `cx-ui-descriptions--${props.size}`,
    `cx-ui-descriptions--placement-${props.labelPlacement}`,
  ];
  if (props.bordered) classes.push('cx-ui-descriptions--bordered');
  if (hasTitle) classes.push('cx-ui-descriptions--with-title');
  return classes;
}
