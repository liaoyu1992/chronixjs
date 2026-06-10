import type { MessageType } from './message-spec.js';

/**
 * Input for `resolveMessageClassList`.
 *
 * Phase 36 (2026-06-05).
 */
export interface ResolveMessageClassListInput {
  readonly type: MessageType;
}

/**
 * Compute class set for a Message root element.
 *
 * Class structure:
 *
 * - `'cx-ui-message'` — always present.
 * - `'cx-ui-message--{type}'` — drives icon + color variant.
 */
export function resolveMessageClassList(input: ResolveMessageClassListInput): string[] {
  return ['cx-ui-message', `cx-ui-message--${input.type}`];
}
