import { describe, expect, it } from 'vitest';

import { defaultIconWrapperProps, type IconWrapperProps } from './icon-wrapper-spec.js';

describe('defaultIconWrapperProps', () => {
  it('matches defaults', () => {
    expect(defaultIconWrapperProps).toEqual({ size: 24, color: undefined });
  });

  it('is spreadable', () => {
    const props: IconWrapperProps = {
      ...defaultIconWrapperProps,
      size: 48,
      color: '#ff0000',
    };
    expect(props.size).toBe(48);
    expect(props.color).toBe('#ff0000');
  });
});
