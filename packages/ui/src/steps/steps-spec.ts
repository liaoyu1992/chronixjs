/**
 * Steps IR — Phase 20 (2026-06-03). Tier A wizard / multi-stage
 * progress indicator.
 *
 * Renders an iterated sequence of `(indicator + content)` items
 * joined by separators. Each step has a derived
 * `StepStatus = 'wait' | 'process' | 'finish' | 'error'` that drives
 * indicator content + CSS modifier. Per Phase 20 Decision B.1 the
 * derivation has TWO sources:
 *
 * - `StepItem.status` (per-item override, takes precedence).
 * - `current: number` (root prop, drives auto-derivation when
 *   per-item `status` is `undefined`).
 *
 * The pure helper `deriveStepItemStatus(item, idx, current)` is the
 * single source of truth for the 3 adapters.
 *
 * Public surface:
 *
 * - **`StepStatus`** — closed union.
 * - **`StepsDirection`** — closed union (`'horizontal' | 'vertical'`).
 * - **`StepItem`** — exported interface; consumer-supplied array
 *   entry.
 * - **`StepsProps`** + **`defaultStepsProps`**.
 * - **`STEP_INDICATOR_FINISH_PLACEHOLDER`** + **`STEP_INDICATOR_ERROR_PLACEHOLDER`**
 *   — unicode characters rendered inside the indicator for the
 *   finish + error statuses. Phase 9 icon registry will substitute
 *   SVGs once geometry helpers mature; this is the Phase 20 stub
 *   matching Phase 15 Empty / Phase 18 Result / Phase 19 PageHeader
 *   placeholder-icon convention.
 */

/** Per-step semantic status. */
export type StepStatus = 'wait' | 'process' | 'finish' | 'error';

/** Layout direction. */
export type StepsDirection = 'horizontal' | 'vertical';

export interface StepItem {
  /**
   * Unique key for `v-for` (Vue) / `Children.map` (React).
   * Consumer-supplied; chronix-ui does NOT auto-derive from
   * `title` because titles can repeat.
   */
  readonly key: string;
  /** Displayed step title. */
  readonly title: string;
  /** Optional sub-text shown below the title. `undefined` omits. */
  readonly description: string | undefined;
  /**
   * Per-step status override. When `undefined`, the status is
   * auto-derived from `idx` vs `current` per
   * `deriveStepItemStatus`. When set, the value wins verbatim —
   * lets consumers mark a step as `'error'` while another step is
   * `'process'`.
   */
  readonly status: StepStatus | undefined;
}

export interface StepsProps {
  /** Ordered step list. Empty array renders empty Steps. */
  readonly items: readonly StepItem[];
  /**
   * Index of the active step (0-based). Drives auto-derivation of
   * each step's status when the per-item `status` field is
   * `undefined`. Out-of-range values are tolerated — derivation
   * simply yields `'finish'` for everything below + `'wait'` for
   * everything above.
   */
  readonly current: number;
  /** Layout direction. Default `'horizontal'`. */
  readonly direction: StepsDirection;
}

export const defaultStepsProps: StepsProps = {
  items: [],
  current: 0,
  direction: 'horizontal',
};

/**
 * Unicode placeholder rendered inside the indicator for the
 * `'finish'` status. Phase 9 icon registry SVG swap pending.
 */
export const STEP_INDICATOR_FINISH_PLACEHOLDER = '✓';

/**
 * Unicode placeholder rendered inside the indicator for the
 * `'error'` status. Phase 9 icon registry SVG swap pending.
 */
export const STEP_INDICATOR_ERROR_PLACEHOLDER = '✕';
