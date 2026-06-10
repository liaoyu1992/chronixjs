import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixIcon } from './chronix-icon.js';

describe('ChronixIcon (vue3)', () => {
  it('renders <svg> for a registered icon', () => {
    const wrapper = mount(ChronixIcon, { props: { name: 'check' } });
    expect((wrapper.element as HTMLElement).tagName.toLowerCase()).toBe('svg');
    expect(wrapper.classes()).toContain('cx-ui-icon');
    expect(wrapper.classes()).not.toContain('cx-ui-icon--missing');
    expect(wrapper.findAll('path').length).toBeGreaterThan(0);
  });

  it('renders missing placeholder for unknown icon name', () => {
    const wrapper = mount(ChronixIcon, { props: { name: 'no-such-icon' } });
    expect((wrapper.element as HTMLElement).tagName).toBe('SPAN');
    expect(wrapper.classes()).toContain('cx-ui-icon--missing');
    expect(wrapper.text()).toBe('?');
  });

  it('honors the size prop on width/height attributes', () => {
    const wrapper = mount(ChronixIcon, { props: { name: 'check', size: 32 } });
    expect(wrapper.attributes('width')).toBe('32');
    expect(wrapper.attributes('height')).toBe('32');
  });

  it('injects the chronix-icon stylesheet', () => {
    mount(ChronixIcon, { props: { name: 'check' } });
    expect(document.head.querySelector('style[data-chronix-ui="icon"]')).not.toBeNull();
  });
});
