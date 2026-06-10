/**
 * chronix-ui steps module — Phase 20 (2026-06-03).
 */

export type { StepItem, StepStatus, StepsDirection, StepsProps } from './steps-spec.js';
export {
  defaultStepsProps,
  STEP_INDICATOR_ERROR_PLACEHOLDER,
  STEP_INDICATOR_FINISH_PLACEHOLDER,
} from './steps-spec.js';
export { deriveStepItemStatus } from './derive-step-item-status.js';
export { getStepIndicatorContent } from './get-step-indicator-content.js';
export { resolveStepsClassList } from './resolve-steps-class-list.js';
export { resolveStepItemClassList } from './resolve-step-item-class-list.js';
export { CHRONIX_STEPS_CSS, ensureChronixStepsStyles } from './steps-styles.js';
