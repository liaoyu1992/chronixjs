/**
 * Transfer module — .
 *
 * Framework-agnostic transfer IR: list computation, filtering,
 * bulk actions, BEM class resolvers, CSS.
 */

export type { TransferOption, TransferProps } from './transfer-spec.js';
export { defaultTransferProps } from './transfer-spec.js';

export type { TransferBulkAction } from './compute-transfer-lists.js';
export {
  computeTransferBulkValue,
  computeTransferLists,
  filterTransferOptions,
} from './compute-transfer-lists.js';

export type {
  ResolveTransferItemClassListInput,
  ResolveTransferRootClassListInput,
} from './resolve-transfer-class-list.js';
export {
  resolveTransferActionsClassList,
  resolveTransferBodyClassList,
  resolveTransferFilterInputClassList,
  resolveTransferHeaderClassList,
  resolveTransferItemClassList,
  resolveTransferPanelClassList,
  resolveTransferRootClassList,
} from './resolve-transfer-class-list.js';

export { CHRONIX_TRANSFER_CSS, ensureChronixTransferStyles } from './transfer-styles.js';
