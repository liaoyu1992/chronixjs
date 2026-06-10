import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';

import { ChronixWave } from './chronix-wave.js';

describe('ChronixWave (vue3)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a wrapper span with base class', () => {
    const wrapper = mount(ChronixWave, { slots: { default: () => 'inner' } });
    expect((wrapper.element as HTMLElement).tagName).toBe('SPAN');
    expect((wrapper.element as HTMLElement).classList.contains('cx-ui-wave')).toBe(true);
  });

  it('adds --disabled modifier when disabled=true', () => {
    const wrapper = mount(ChronixWave, {
      props: { disabled: true },
      slots: { default: () => 'x' },
    });
    expect((wrapper.element as HTMLElement).classList.contains('cx-ui-wave--disabled')).toBe(true);
  });

  it('applies the custom CSS color via inline style', () => {
    const wrapper = mount(ChronixWave, {
      props: { color: 'red' },
      slots: { default: () => 'x' },
    });
    expect((wrapper.element as HTMLElement).style.getPropertyValue('--cx-ui-wave-color')).toBe(
      'red',
    );
  });

  it('injects the chronix-wave stylesheet', () => {
    mount(ChronixWave, { slots: { default: () => 'x' } });
    expect(document.head.querySelector('style[data-chronix-ui="wave"]')).not.toBeNull();
  });
});
