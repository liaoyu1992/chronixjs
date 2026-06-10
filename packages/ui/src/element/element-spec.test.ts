import { describe, expect, it } from 'vitest';

import { defaultElementProps, type ElementProps } from './element-spec.js';

describe('defaultElementProps', () => {
  it('matches the documented defaults', () => {
    expect(defaultElementProps).toEqual({ tag: 'span', inline: false });
  });

  it('is spreadable', () => {
    const props: ElementProps = { ...defaultElementProps, tag: 'section', inline: true };
    expect(props.tag).toBe('section');
    expect(props.inline).toBe(true);
  });
});
