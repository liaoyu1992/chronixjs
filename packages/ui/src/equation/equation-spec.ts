/**
 * Equation IR — Phase 24 (2026-06-03). Tier A MathML renderer.
 * Adapter injects `value` as innerHTML inside a native `<math>`.
 */

export type EquationDisplay = 'inline' | 'block';

export interface EquationProps {
  /** MathML markup string. Consumer is responsible for correctness. */
  readonly value: string;
  readonly display: EquationDisplay;
}

export const defaultEquationProps: EquationProps = {
  value: '',
  display: 'inline',
};
