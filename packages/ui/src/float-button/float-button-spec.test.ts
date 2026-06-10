import { describe, expect, it } from 'vitest';

import { defaultFloatButtonProps, resolveFloatButtonPositionStyle } from './float-button-spec.js';

describe('defaultFloatButtonProps', () => {
  it('defaults to circle / default / bottom-right corner 24', () => {
    expect(defaultFloatButtonProps).toEqual({
      shape: 'circle',
      type: 'default',
      right: 24,
      bottom: 24,
      top: undefined,
      left: undefined,
      icon: undefined,
      tooltip: undefined,
      description: undefined,
    });
  });
});

describe('resolveFloatButtonPositionStyle', () => {
  it('defaults to bottom-right when top + left are undefined', () => {
    expect(
      resolveFloatButtonPositionStyle({
        right: 24,
        bottom: 24,
        top: undefined,
        left: undefined,
      }),
    ).toEqual({ position: 'fixed', right: '24px', bottom: '24px' });
  });

  it('top overrides bottom when defined', () => {
    expect(
      resolveFloatButtonPositionStyle({
        right: 30,
        bottom: 20,
        top: 10,
        left: undefined,
      }),
    ).toEqual({ position: 'fixed', top: '10px', right: '30px' });
  });

  it('left overrides right when defined', () => {
    expect(
      resolveFloatButtonPositionStyle({
        right: 30,
        bottom: 20,
        top: undefined,
        left: 5,
      }),
    ).toEqual({ position: 'fixed', bottom: '20px', left: '5px' });
  });

  it('top + left define top-left corner', () => {
    expect(
      resolveFloatButtonPositionStyle({
        right: 30,
        bottom: 20,
        top: 10,
        left: 5,
      }),
    ).toEqual({ position: 'fixed', top: '10px', left: '5px' });
  });
});
