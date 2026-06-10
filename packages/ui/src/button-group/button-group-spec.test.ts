import { describe, expect, it } from 'vitest';

import { defaultButtonGroupProps, type ButtonGroupProps } from './button-group-spec.js';

describe('defaultButtonGroupProps', () => {
  it('matches the documented defaults', () => {
    expect(defaultButtonGroupProps).toEqual({ vertical: false, size: undefined });
  });

  it('is spreadable into a ButtonGroupProps', () => {
    const props: ButtonGroupProps = {
      ...defaultButtonGroupProps,
      vertical: true,
      size: 'large',
    };
    expect(props.vertical).toBe(true);
    expect(props.size).toBe('large');
  });
});
