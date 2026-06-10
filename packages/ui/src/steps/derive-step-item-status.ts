import type { StepItem, StepStatus } from './steps-spec.js';

/**
 * Pure helper — compute the derived status for a single step,
 * combining the per-item override + the root-level `current` index.
 *
 * Phase 20 (2026-06-03). Single source of truth for the 3 adapters
 * + the root-level `--has-error` aggregation.
 *
 * Contract (Phase 20 Decision B.1):
 *
 * - `item.status !== undefined` → that value wins verbatim. Lets
 *   consumers mark an arbitrary step as `'error'` while another
 *   step is `'process'` (e.g. a wizard with a failed background
 *   validation on a completed step while user is editing the
 *   active one).
 * - `item.status === undefined`:
 *   - `idx < current` → `'finish'` (already completed).
 *   - `idx === current` → `'process'` (currently active).
 *   - `idx > current` → `'wait'` (not yet reached).
 *
 * The helper is cheap (single conditional cascade) — called twice
 * per item per render at the adapter layer (once at the root
 * class-list level to compute `--has-error`, once per-item for the
 * `--{status}` modifier). No memoization in v0.1.0.
 */
export function deriveStepItemStatus(item: StepItem, idx: number, current: number): StepStatus {
  if (item.status !== undefined) return item.status;
  if (idx < current) return 'finish';
  if (idx === current) return 'process';
  return 'wait';
}
