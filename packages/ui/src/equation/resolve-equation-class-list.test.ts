import { describe, expect, it } from 'vitest';

import { defaultEquationProps, type EquationProps } from './equation-spec.js';
import { resolveEquationClassList } from './resolve-equation-class-list.js';

function props(over: Partial<EquationProps> = {}): EquationProps {
  return { ...defaultEquationProps, ...over };
}

describe('resolveEquationClassList', () => {
  it('returns base + --inline by default', () => {
    expect(resolveEquationClassList(props())).toEqual(['cx-ui-equation', 'cx-ui-equation--inline']);
  });

  it('returns base + --block for display=block', () => {
    expect(resolveEquationClassList(props({ display: 'block' }))).toEqual([
      'cx-ui-equation',
      'cx-ui-equation--block',
    ]);
  });
});
