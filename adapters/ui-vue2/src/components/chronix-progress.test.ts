import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixProgress } from './chronix-progress.js';

const Progress = ChronixProgress as unknown as VueConstructor;

describe('ChronixProgress (vue2) — default rendering', () => {
  it('renders a <div> with base + default + with-info + info-outside', () => {
    const wrapper = mount(Progress);
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-progress');
    expect(wrapper.classes()).toContain('cx-ui-progress--default');
    expect(wrapper.classes()).toContain('cx-ui-progress--with-info');
    expect(wrapper.classes()).toContain('cx-ui-progress--info-outside');
  });

  it('renders __rail + __fill (zero-width) + __info (0%) at default percentage', () => {
    const wrapper = mount(Progress);
    expect(wrapper.find('.cx-ui-progress__rail').exists()).toBe(true);
    const fill = wrapper.find('.cx-ui-progress__fill');
    expect(fill.exists()).toBe(true);
    expect(fill.attributes('style')).toMatch(/width:\s*0%/);
    expect(wrapper.find('.cx-ui-progress__info').text()).toBe('0%');
  });
});

describe('ChronixProgress (vue2) — percentage prop', () => {
  it.each([
    [25, '25%'],
    [50, '50%'],
    [42, '42%'],
    [100, '100%'],
  ])('percentage=%i renders __fill width + __info text "%s"', (pct, label) => {
    const wrapper = mount(Progress, { propsData: { percentage: pct } });
    const fill = wrapper.find('.cx-ui-progress__fill');
    expect(fill.attributes('style')).toMatch(new RegExp(`width:\\s*${pct}%`));
    expect(wrapper.find('.cx-ui-progress__info').text()).toBe(label);
  });

  it('clamps over-100% percentages to 100% on both fill and info', () => {
    const wrapper = mount(Progress, { propsData: { percentage: 150 } });
    expect(wrapper.find('.cx-ui-progress__fill').attributes('style')).toMatch(/width:\s*100%/);
    expect(wrapper.find('.cx-ui-progress__info').text()).toBe('100%');
  });
});

describe('ChronixProgress (vue2) — type prop', () => {
  it.each(['default', 'success', 'warning', 'error', 'info'] as const)(
    'type="%s" adds the matching modifier',
    (t) => {
      const wrapper = mount(Progress, { propsData: { type: t } });
      expect(wrapper.classes()).toContain(`cx-ui-progress--${t}`);
    },
  );
});

describe('ChronixProgress (vue2) — showInfo + placement', () => {
  it('omits __info element + classes when showInfo=false', () => {
    const wrapper = mount(Progress, { propsData: { showInfo: false } });
    expect(wrapper.find('.cx-ui-progress__info').exists()).toBe(false);
    expect(wrapper.classes()).not.toContain('cx-ui-progress--with-info');
  });

  it('renders __info inside __rail when placement=inside', () => {
    const wrapper = mount(Progress, {
      propsData: { percentage: 60, indicatorPlacement: 'inside' },
    });
    expect(wrapper.classes()).toContain('cx-ui-progress--info-inside');
    const info = wrapper.find('.cx-ui-progress__rail .cx-ui-progress__info');
    expect(info.exists()).toBe(true);
    expect(info.text()).toBe('60%');
  });
});

describe('ChronixProgress (vue2) — height prop', () => {
  it('applies inline style height when supplied', () => {
    const wrapper = mount(Progress, { propsData: { height: 12 } });
    const rail = wrapper.find('.cx-ui-progress__rail');
    expect(rail.attributes('style')).toMatch(/height:\s*12px/);
  });
});

describe('ChronixProgress (vue2) — CSS injection', () => {
  it('mounting ensures the chronix-progress stylesheet is in document.head', () => {
    mount(Progress);
    expect(document.head.querySelector('style[data-chronix-ui="progress"]')).not.toBeNull();
  });
});
