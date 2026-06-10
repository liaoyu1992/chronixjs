import type { EquationProps } from './equation-spec.js';

export function resolveEquationClassList(props: EquationProps): string[] {
  return ['cx-ui-equation', `cx-ui-equation--${props.display}`];
}
