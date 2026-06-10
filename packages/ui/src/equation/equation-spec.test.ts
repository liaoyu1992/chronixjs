import { describe, expect, it } from 'vitest';

import { defaultEquationProps, type EquationProps } from './equation-spec.js';

describe('defaultEquationProps', () => {
  it('matches defaults', () => {
    expect(defaultEquationProps).toEqual({ value: '', display: 'inline' });
  });

  it('is spreadable', () => {
    const props: EquationProps = {
      ...defaultEquationProps,
      value: '<mrow><mi>x</mi></mrow>',
      display: 'block',
    };
    expect(props.value).toBe('<mrow><mi>x</mi></mrow>');
    expect(props.display).toBe('block');
  });
});
