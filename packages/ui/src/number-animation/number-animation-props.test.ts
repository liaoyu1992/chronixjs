import { describe, expect, it } from 'vitest';

import {
  defaultNumberAnimationProps,
  type NumberAnimationProps,
} from './number-animation-props.js';

function props(over: Partial<NumberAnimationProps> = {}): NumberAnimationProps {
  return { ...defaultNumberAnimationProps, ...over };
}

describe('defaultNumberAnimationProps', () => {
  it('matches defaults', () => {
    expect(defaultNumberAnimationProps).toEqual({
      from: 0,
      to: 0,
      duration: 2000,
      precision: 0,
      active: true,
      showSeparator: false,
    });
  });

  it('accepts overrides', () => {
    const p = props({
      from: 10,
      to: 100,
      duration: 500,
      precision: 2,
      showSeparator: true,
      locale: 'de-DE',
    });
    expect(p.from).toBe(10);
    expect(p.to).toBe(100);
    expect(p.duration).toBe(500);
    expect(p.precision).toBe(2);
    expect(p.showSeparator).toBe(true);
    expect(p.locale).toBe('de-DE');
  });
});
