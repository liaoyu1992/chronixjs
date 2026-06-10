import { describe, expect, it } from 'vitest';

import { defaultIconProps, resolveIconRenderMode, type IconProps } from './icon-props.js';

describe('defaultIconProps', () => {
  it('matches defaults', () => {
    expect(defaultIconProps).toEqual({ name: '', size: 16 });
  });

  it('is spreadable', () => {
    const props: IconProps = { ...defaultIconProps, name: 'check', size: 24 };
    expect(props.name).toBe('check');
    expect(props.size).toBe(24);
  });
});

describe('resolveIconRenderMode', () => {
  it("returns 'svg' for a registered default icon", () => {
    expect(resolveIconRenderMode('check')).toBe('svg');
  });

  it("returns 'missing' for an unknown name", () => {
    expect(resolveIconRenderMode('no-such-icon-name')).toBe('missing');
  });
});
