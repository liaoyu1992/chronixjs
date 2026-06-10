import { describe, expect, it } from 'vitest';

import { defaultButtonProps, type ButtonProps } from './button-spec.js';

describe('defaultButtonProps', () => {
  it('has the 5 expected fields', () => {
    expect(Object.keys(defaultButtonProps).sort()).toEqual(
      ['block', 'disabled', 'htmlType', 'size', 'variant'].sort(),
    );
  });

  it('variant defaults to "default"', () => {
    expect(defaultButtonProps.variant).toBe('default');
  });

  it('size defaults to "medium"', () => {
    expect(defaultButtonProps.size).toBe('medium');
  });

  it('disabled defaults to false', () => {
    expect(defaultButtonProps.disabled).toBe(false);
  });

  it('block defaults to false', () => {
    expect(defaultButtonProps.block).toBe(false);
  });

  it('htmlType defaults to "button" (not the browser default "submit")', () => {
    expect(defaultButtonProps.htmlType).toBe('button');
  });

  it('type-narrowed unions accept all documented values', () => {
    const variants: ButtonProps['variant'][] = ['default', 'primary'];
    const sizes: ButtonProps['size'][] = ['small', 'medium', 'large'];
    const htmlTypes: ButtonProps['htmlType'][] = ['button', 'submit', 'reset'];
    expect(variants).toHaveLength(2);
    expect(sizes).toHaveLength(3);
    expect(htmlTypes).toHaveLength(3);
  });
});
