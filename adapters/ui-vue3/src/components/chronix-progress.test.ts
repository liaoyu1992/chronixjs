import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixProgress } from './chronix-progress.js';

describe('ChronixProgress — default rendering', () => {
  it('renders a <div> with base + default + with-info + info-outside', () => {
    const wrapper = mount(ChronixProgress);
    expect((wrapper.element as HTMLElement).tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-progress');
    expect(wrapper.classes()).toContain('cx-ui-progress--default');
    expect(wrapper.classes()).toContain('cx-ui-progress--with-info');
    expect(wrapper.classes()).toContain('cx-ui-progress--info-outside');
  });

  it('renders __rail + __fill (zero-width) + __info (0%) at default percentage', () => {
    const wrapper = mount(ChronixProgress);
    expect(wrapper.find('.cx-ui-progress__rail').exists()).toBe(true);
    const fill = wrapper.find('.cx-ui-progress__fill');
    expect(fill.exists()).toBe(true);
    expect(fill.attributes('style')).toMatch(/width:\s*0%/);
    expect(wrapper.find('.cx-ui-progress__info').text()).toBe('0%');
  });
});

describe('ChronixProgress — percentage prop', () => {
  it.each([
    [25, '25%'],
    [50, '50%'],
    [42, '42%'],
    [100, '100%'],
  ])('percentage=%i renders __fill width + __info text "%s"', (pct, label) => {
    const wrapper = mount(ChronixProgress, { props: { percentage: pct } });
    const fill = wrapper.find('.cx-ui-progress__fill');
    expect(fill.attributes('style')).toMatch(new RegExp(`width:\\s*${pct}%`));
    expect(wrapper.find('.cx-ui-progress__info').text()).toBe(label);
  });

  it('clamps over-100% percentages to 100% on both fill and info', () => {
    const wrapper = mount(ChronixProgress, { props: { percentage: 150 } });
    expect(wrapper.find('.cx-ui-progress__fill').attributes('style')).toMatch(/width:\s*100%/);
    expect(wrapper.find('.cx-ui-progress__info').text()).toBe('100%');
  });
});

describe('ChronixProgress — type prop', () => {
  it.each(['default', 'success', 'warning', 'error', 'info'] as const)(
    'type="%s" adds the matching modifier',
    (t) => {
      const wrapper = mount(ChronixProgress, { props: { type: t } });
      expect(wrapper.classes()).toContain(`cx-ui-progress--${t}`);
    },
  );
});

describe('ChronixProgress — showInfo + placement', () => {
  it('omits __info element + classes when showInfo=false', () => {
    const wrapper = mount(ChronixProgress, { props: { showInfo: false } });
    expect(wrapper.find('.cx-ui-progress__info').exists()).toBe(false);
    expect(wrapper.classes()).not.toContain('cx-ui-progress--with-info');
  });

  it('renders __info inside __rail when placement=inside', () => {
    const wrapper = mount(ChronixProgress, {
      props: { percentage: 60, indicatorPlacement: 'inside' },
    });
    expect(wrapper.classes()).toContain('cx-ui-progress--info-inside');
    const info = wrapper.find('.cx-ui-progress__rail .cx-ui-progress__info');
    expect(info.exists()).toBe(true);
    expect(info.text()).toBe('60%');
  });
});

describe('ChronixProgress — height prop', () => {
  it('applies inline style height when supplied', () => {
    const wrapper = mount(ChronixProgress, { props: { height: 12 } });
    const rail = wrapper.find('.cx-ui-progress__rail');
    expect(rail.attributes('style')).toMatch(/height:\s*12px/);
  });

  it('omits inline height when undefined (CSS-default)', () => {
    const wrapper = mount(ChronixProgress);
    const rail = wrapper.find('.cx-ui-progress__rail');
    expect(rail.attributes('style') ?? '').not.toMatch(/height:/);
  });
});

describe('ChronixProgress — CSS injection', () => {
  it('mounting ensures the chronix-progress stylesheet is in document.head', () => {
    mount(ChronixProgress);
    expect(document.head.querySelector('style[data-chronix-ui="progress"]')).not.toBeNull();
  });
});
