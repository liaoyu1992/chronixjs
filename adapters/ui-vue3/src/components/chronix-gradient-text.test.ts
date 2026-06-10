import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixGradientText } from './chronix-gradient-text.js';

describe('ChronixGradientText (vue3)', () => {
  it('renders a <span> with base class + linear-gradient background', () => {
    const wrapper = mount(ChronixGradientText, { props: { value: 'rainbow' } });
    expect((wrapper.element as HTMLElement).tagName).toBe('SPAN');
    expect(wrapper.classes()).toContain('cx-ui-gradient-text');
    expect(wrapper.text()).toBe('rainbow');
    const bg = (wrapper.element as HTMLElement).style.background;
    expect(bg).toContain('linear-gradient');
  });

  it('honors custom colors + direction in the inline style', () => {
    const wrapper = mount(ChronixGradientText, {
      props: { value: 'x', colors: ['#ff0000', '#0000ff'], direction: 45 },
    });
    const bg = (wrapper.element as HTMLElement).style.background.toLowerCase();
    expect(bg).toContain('45deg');
    // happy-dom may keep hex literals; chromium normalizes to rgb().
    expect(bg).toMatch(/#ff0000|rgb\(255,\s*0,\s*0\)/);
    expect(bg).toMatch(/#0000ff|rgb\(0,\s*0,\s*255\)/);
  });

  it('injects the chronix-gradient-text stylesheet', () => {
    mount(ChronixGradientText);
    expect(document.head.querySelector('style[data-chronix-ui="gradient-text"]')).not.toBeNull();
  });
});
