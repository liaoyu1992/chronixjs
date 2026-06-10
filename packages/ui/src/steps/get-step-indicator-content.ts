import {
  STEP_INDICATOR_ERROR_PLACEHOLDER,
  STEP_INDICATOR_FINISH_PLACEHOLDER,
  type StepStatus,
} from './steps-spec.js';

/**
 * Pure helper — compute the string rendered inside the
 * `cx-ui-steps__index` indicator element for a single step.
 *
 * Phase 20 (2026-06-03). Single source of truth for the 3 adapters
 * so the rendered character is byte-identical across vue3 / vue2 /
 * react (cross-demo Playwright fingerprint stays stable).
 *
 * Contract:
 *
 * - `'finish'` → `STEP_INDICATOR_FINISH_PLACEHOLDER` (`'✓'`).
 * - `'error'`  → `STEP_INDICATOR_ERROR_PLACEHOLDER` (`'✕'`).
 * - `'process' | 'wait'` → 1-based index string (`String(idx + 1)`).
 *
 * Phase 9 icon registry will SVG-substitute the finish + error
 * placeholders when geometry helpers mature.
 */
export function getStepIndicatorContent(derivedStatus: StepStatus, idx: number): string {
  if (derivedStatus === 'finish') return STEP_INDICATOR_FINISH_PLACEHOLDER;
  if (derivedStatus === 'error') return STEP_INDICATOR_ERROR_PLACEHOLDER;
  return String(idx + 1);
}
