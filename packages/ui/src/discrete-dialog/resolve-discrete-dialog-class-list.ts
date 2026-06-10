import type { DialogType } from './discrete-dialog-spec.js';

/**
 * Input for `resolveDiscreteDialogClassList`.
 *
 * Phase 36 (2026-06-05).
 */
export interface ResolveDiscreteDialogClassListInput {
  readonly type: DialogType;
}

/**
 * Compute class set for a Discrete Dialog root element.
 *
 * Class structure:
 *
 * - `'cx-ui-dialog'` — always present.
 * - `'cx-ui-dialog--{type}'` — drives icon + color variant.
 */
export function resolveDiscreteDialogClassList(
  input: ResolveDiscreteDialogClassListInput,
): string[] {
  return ['cx-ui-dialog', `cx-ui-dialog--${input.type}`];
}
