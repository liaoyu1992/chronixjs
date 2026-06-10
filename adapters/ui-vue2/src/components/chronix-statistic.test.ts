import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixStatistic } from './chronix-statistic.js';

const Statistic = ChronixStatistic as unknown as VueConstructor;

describe('ChronixStatistic (vue2) — default rendering', () => {
  it('renders a <div> with base + tabular-nums', () => {
    const wrapper = mount(Statistic);
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-statistic');
    expect(wrapper.classes()).toContain('cx-ui-statistic--tabular-nums');
  });

  it('renders __value with "-" placeholder when value undefined', () => {
    const wrapper = mount(Statistic);
    expect(wrapper.find('.cx-ui-statistic__value').text()).toBe('-');
  });

  it('omits __label when undefined', () => {
    const wrapper = mount(Statistic);
    expect(wrapper.find('.cx-ui-statistic__label').exists()).toBe(false);
  });
});

describe('ChronixStatistic (vue2) — value formatting', () => {
  it('numeric value with precision applies toFixed', () => {
    const wrapper = mount(Statistic, {
      propsData: { value: 1234.5678, precision: 2 },
    });
    expect(wrapper.find('.cx-ui-statistic__value').text()).toBe('1234.57');
  });

  it('string value passes through verbatim', () => {
    const wrapper = mount(Statistic, { propsData: { value: '1.2K' } });
    expect(wrapper.find('.cx-ui-statistic__value').text()).toBe('1.2K');
  });

  it('non-finite numeric renders "-" placeholder', () => {
    const wrapper = mount(Statistic, { propsData: { value: Number.NaN } });
    expect(wrapper.find('.cx-ui-statistic__value').text()).toBe('-');
  });
});

describe('ChronixStatistic (vue2) — label + prefix/suffix slots', () => {
  it('renders __label when label is supplied', () => {
    const wrapper = mount(Statistic, { propsData: { label: 'Revenue' } });
    expect(wrapper.classes()).toContain('cx-ui-statistic--with-label');
    expect(wrapper.find('.cx-ui-statistic__label').text()).toBe('Revenue');
  });

  it('renders prefix + suffix from slots', () => {
    const wrapper = mount(Statistic, {
      propsData: { value: 1234 },
      slots: { prefix: '$', suffix: 'USD' },
    });
    expect(wrapper.find('.cx-ui-statistic__prefix').text()).toBe('$');
    expect(wrapper.find('.cx-ui-statistic__suffix').text()).toBe('USD');
    expect(wrapper.classes()).toContain('cx-ui-statistic--with-prefix');
    expect(wrapper.classes()).toContain('cx-ui-statistic--with-suffix');
  });
});

describe('ChronixStatistic (vue2) — tabular-nums', () => {
  it('omits --tabular-nums when tabularNums=false', () => {
    const wrapper = mount(Statistic, { propsData: { tabularNums: false } });
    expect(wrapper.classes()).not.toContain('cx-ui-statistic--tabular-nums');
  });
});

describe('ChronixStatistic (vue2) — CSS injection', () => {
  it('mounting ensures the chronix-statistic stylesheet is in document.head', () => {
    mount(Statistic);
    expect(document.head.querySelector('style[data-chronix-ui="statistic"]')).not.toBeNull();
  });
});
