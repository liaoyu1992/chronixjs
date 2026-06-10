import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixRate } from './chronix-rate.js';

describe('ChronixRate (vue3)', () => {
  it('renders <div> root + 5 default stars', () => {
    const wrapper = mount(ChronixRate);
    expect((wrapper.element as HTMLElement).tagName).toBe('DIV');
    expect(wrapper.findAll('button.cx-ui-rate__star')).toHaveLength(5);
  });

  it('respects count prop', () => {
    const wrapper = mount(ChronixRate, { props: { count: 7 } });
    expect(wrapper.findAll('button.cx-ui-rate__star')).toHaveLength(7);
  });

  it('marks --full / --empty stars per value=3', () => {
    const wrapper = mount(ChronixRate, { props: { value: 3 } });
    const stars = wrapper.findAll('button.cx-ui-rate__star');
    expect(stars[0]!.classes()).toContain('cx-ui-rate__star--full');
    expect(stars[2]!.classes()).toContain('cx-ui-rate__star--full');
    expect(stars[3]!.classes()).toContain('cx-ui-rate__star--empty');
  });

  it('shows --half when allowHalf + value=2.5', () => {
    const wrapper = mount(ChronixRate, {
      props: { value: 2.5, allowHalf: true },
    });
    const stars = wrapper.findAll('button.cx-ui-rate__star');
    expect(stars[2]!.classes()).toContain('cx-ui-rate__star--half');
  });

  it('star buttons have type=button (no form submit)', () => {
    const wrapper = mount(ChronixRate);
    const buttons = wrapper.findAll('button.cx-ui-rate__star');
    for (const b of buttons) {
      expect(b.attributes('type')).toBe('button');
    }
  });

  it('injects the chronix-rate stylesheet', () => {
    mount(ChronixRate);
    expect(document.head.querySelector('style[data-chronix-ui="rate"]')).not.toBeNull();
  });
});
