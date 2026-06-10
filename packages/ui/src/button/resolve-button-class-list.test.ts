import { describe, expect, it } from 'vitest';

import { defaultButtonProps } from './button-spec.js';
import { resolveButtonClassList } from './resolve-button-class-list.js';

describe('resolveButtonClassList', () => {
  it('default props → block + default variant + medium size only', () => {
    expect(resolveButtonClassList(defaultButtonProps)).toEqual([
      'cx-ui-button',
      'cx-ui-button--default',
      'cx-ui-button--medium',
    ]);
  });

  it('primary variant', () => {
    expect(resolveButtonClassList({ ...defaultButtonProps, variant: 'primary' })).toEqual([
      'cx-ui-button',
      'cx-ui-button--primary',
      'cx-ui-button--medium',
    ]);
  });

  it('small size', () => {
    expect(resolveButtonClassList({ ...defaultButtonProps, size: 'small' })).toContain(
      'cx-ui-button--small',
    );
  });

  it('large size', () => {
    expect(resolveButtonClassList({ ...defaultButtonProps, size: 'large' })).toContain(
      'cx-ui-button--large',
    );
  });

  it('disabled adds --disabled class', () => {
    const classes = resolveButtonClassList({ ...defaultButtonProps, disabled: true });
    expect(classes).toContain('cx-ui-button--disabled');
  });

  it('block adds --block class', () => {
    const classes = resolveButtonClassList({ ...defaultButtonProps, block: true });
    expect(classes).toContain('cx-ui-button--block');
  });

  it('combines all optional class modifiers', () => {
    expect(
      resolveButtonClassList({
        variant: 'primary',
        size: 'large',
        disabled: true,
        block: true,
        htmlType: 'submit',
      }),
    ).toEqual([
      'cx-ui-button',
      'cx-ui-button--primary',
      'cx-ui-button--large',
      'cx-ui-button--disabled',
      'cx-ui-button--block',
    ]);
  });

  it('returns a fresh array each call', () => {
    const a = resolveButtonClassList(defaultButtonProps);
    const b = resolveButtonClassList(defaultButtonProps);
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });

  it('order is stable: block, variant, size, [disabled], [block]', () => {
    const classes = resolveButtonClassList({
      variant: 'primary',
      size: 'small',
      disabled: true,
      block: true,
      htmlType: 'button',
    });
    expect(classes.indexOf('cx-ui-button')).toBe(0);
    expect(classes.indexOf('cx-ui-button--primary')).toBe(1);
    expect(classes.indexOf('cx-ui-button--small')).toBe(2);
    expect(classes.indexOf('cx-ui-button--disabled')).toBe(3);
    expect(classes.indexOf('cx-ui-button--block')).toBe(4);
  });
});
