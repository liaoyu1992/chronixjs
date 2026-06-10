/**
 * chronix-ui message module — Phase 36 (2026-06-05).
 */

export type {
  MessageItem,
  MessagePlacement,
  MessageQueueOptions,
  MessageType,
} from './message-spec.js';
export { createMessageItemId } from './create-message-item-id.js';
export type { ResolveMessageClassListInput } from './resolve-message-class-list.js';
export { resolveMessageClassList } from './resolve-message-class-list.js';
export { CHRONIX_MESSAGE_CSS, ensureChronixMessageStyles } from './message-styles.js';
