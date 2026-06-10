// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { defaultFocusDetectorProps, shouldEmitFocusDetectorEvent } from './focus-detector-spec.js';

describe('defaultFocusDetectorProps', () => {
  it('defaults to not-disabled', () => {
    expect(defaultFocusDetectorProps).toEqual({ disabled: false });
  });
});

describe('shouldEmitFocusDetectorEvent', () => {
  function setupWrapper(): { wrapper: HTMLElement; inside: HTMLElement; outside: HTMLElement } {
    const wrapper = document.createElement('div');
    const inside = document.createElement('button');
    const outside = document.createElement('button');
    wrapper.appendChild(inside);
    document.body.appendChild(wrapper);
    document.body.appendChild(outside);
    return { wrapper, inside, outside };
  }

  it('returns true when relatedTarget is null (focus moves to body)', () => {
    const { wrapper } = setupWrapper();
    expect(shouldEmitFocusDetectorEvent({ currentTarget: wrapper, relatedTarget: null })).toBe(
      true,
    );
  });

  it('returns true when relatedTarget is outside the wrapper', () => {
    const { wrapper, outside } = setupWrapper();
    expect(shouldEmitFocusDetectorEvent({ currentTarget: wrapper, relatedTarget: outside })).toBe(
      true,
    );
  });

  it('returns false when relatedTarget is inside the wrapper', () => {
    const { wrapper, inside } = setupWrapper();
    expect(shouldEmitFocusDetectorEvent({ currentTarget: wrapper, relatedTarget: inside })).toBe(
      false,
    );
  });
});
