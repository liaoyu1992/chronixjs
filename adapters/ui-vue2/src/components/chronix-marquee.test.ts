import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixMarquee } from './chronix-marquee.js';

const Marquee = ChronixMarquee as unknown as VueConstructor;

describe('ChronixMarquee (vue2) — root rendering', () => {
  it('renders a <div> with the base + direction classes', () => {
    const wrapper = mount(Marquee);
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-marquee');
    expect(wrapper.classes()).toContain('cx-ui-marquee--direction-left');
  });

  it.each(['left', 'right', 'up', 'down'] as const)(
    'reflects direction="%s" via class modifier',
    (direction) => {
      const wrapper = mount(Marquee, { propsData: { direction } });
      expect(wrapper.classes()).toContain(`cx-ui-marquee--direction-${direction}`);
    },
  );

  it('adds --pause-on-hover modifier when pauseOnHover=true', () => {
    const wrapper = mount(Marquee, {
      propsData: { pauseOnHover: true },
    });
    expect(wrapper.classes()).toContain('cx-ui-marquee--pause-on-hover');
  });
});

describe('ChronixMarquee (vue2) — track + duplicated content', () => {
  it('renders a __track child carrying the animation', () => {
    const wrapper = mount(Marquee);
    expect(wrapper.find('.cx-ui-marquee__track').exists()).toBe(true);
  });

  it('renders exactly TWO __copy children inside __track', () => {
    const wrapper = mount(Marquee, {
      slots: { default: '<span>BTC $50,000</span>' },
    });
    expect(wrapper.findAll('.cx-ui-marquee__copy')).toHaveLength(2);
  });

  it('second __copy is aria-hidden for assistive tech', () => {
    const wrapper = mount(Marquee, {
      slots: { default: '<span>tick</span>' },
    });
    const copies = wrapper.findAll('.cx-ui-marquee__copy');
    expect(copies.at(0).attributes('aria-hidden')).toBeUndefined();
    expect(copies.at(1).attributes('aria-hidden')).toBe('true');
  });

  it('each __copy carries the slot content', () => {
    const wrapper = mount(Marquee, {
      slots: { default: '<span data-testid="item">⭐</span>' },
    });
    const items = wrapper.findAll('[data-testid="item"]');
    expect(items).toHaveLength(2);
  });
});

describe('ChronixMarquee (vue2) — CSS injection', () => {
  it('mounting ensures the chronix-marquee stylesheet is in document.head', () => {
    mount(Marquee);
    expect(document.head.querySelector('style[data-chronix-ui="marquee"]')).not.toBeNull();
  });
});
