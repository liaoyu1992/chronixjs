import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';

import { ChronixFocusDetector } from './chronix-focus-detector.js';

describe('ChronixFocusDetector (vue3)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a span wrapper with base class', () => {
    const wrapper = mount(ChronixFocusDetector, { slots: { default: () => 'inner' } });
    expect((wrapper.element as HTMLElement).tagName).toBe('SPAN');
    expect((wrapper.element as HTMLElement).classList.contains('cx-ui-focus-detector')).toBe(true);
  });

  it('adds --disabled modifier when disabled=true', () => {
    const wrapper = mount(ChronixFocusDetector, {
      props: { disabled: true },
      slots: { default: () => 'x' },
    });
    expect(
      (wrapper.element as HTMLElement).classList.contains('cx-ui-focus-detector--disabled'),
    ).toBe(true);
  });

  it('injects the chronix-focus-detector stylesheet', () => {
    mount(ChronixFocusDetector, { slots: { default: () => 'x' } });
    expect(document.head.querySelector('style[data-chronix-ui="focus-detector"]')).not.toBeNull();
  });
});
