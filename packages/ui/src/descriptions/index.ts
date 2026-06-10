/**
 * chronix-ui descriptions module — Phase 21 (2026-06-03).
 */

export type {
  DescriptionItem,
  DescriptionsLabelPlacement,
  DescriptionsProps,
  DescriptionsSize,
} from './descriptions-spec.js';
export { defaultDescriptionsProps } from './descriptions-spec.js';
export {
  resolveDescriptionsClassList,
  type DescriptionsClassListInput,
} from './resolve-descriptions-class-list.js';
export { resolveDescriptionsGridTemplateColumns } from './resolve-descriptions-grid-template-columns.js';
export {
  resolveDescriptionItemSpanStyle,
  type DescriptionItemSpanStyle,
} from './resolve-description-item-span-style.js';
export {
  CHRONIX_DESCRIPTIONS_CSS,
  ensureChronixDescriptionsStyles,
} from './descriptions-styles.js';
