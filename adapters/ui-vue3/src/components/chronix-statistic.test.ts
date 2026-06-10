import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixStatistic } from './chronix-statistic.js';

describe('ChronixStatistic — default rendering', () => {
  it('renders a <div> with base + tabular-nums', () => {
    const wrapper = mount(ChronixStatistic);
    expect((wrapper.element as HTMLElement).tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-statistic');
    expect(wrapper.classes()).toContain('cx-ui-statistic--tabular-nums');
  });

  it('renders __value with placeholder "-" when value is undefined', () => {
    const wrapper = mount(ChronixStatistic);
    expect(wrapper.find('.cx-ui-statistic__value').text()).toBe('-');
  });

  it('omits __label by default (undefined)', () => {
    const wrapper = mount(ChronixStatistic);
    expect(wrapper.find('.cx-ui-statistic__label').exists()).toBe(false);
    expect(wrapper.classes()).not.toContain('cx-ui-statistic--with-label');
  });

  it('omits prefix / suffix spans when slots empty', () => {
    const wrapper = mount(ChronixStatistic);
    expect(wrapper.find('.cx-ui-statistic__prefix').exists()).toBe(false);
    expect(wrapper.find('.cx-ui-statistic__suffix').exists()).toBe(false);
  });
});

describe('ChronixStatistic — value formatting', () => {
  it('numeric value renders verbatim when precision undefined', () => {
    const wrapper = mount(ChronixStatistic, { props: { value: 42 } });
    expect(wrapper.find('.cx-ui-statistic__value').text()).toBe('42');
  });

  it('numeric value with precision applies toFixed', () => {
    const wrapper = mount(ChronixStatistic, { props: { value: 1234.5678, precision: 2 } });
    expect(wrapper.find('.cx-ui-statistic__value').text()).toBe('1234.57');
  });

  it('string value passes through verbatim', () => {
    const wrapper = mount(ChronixStatistic, { props: { value: '1.2K' } });
    expect(wrapper.find('.cx-ui-statistic__value').text()).toBe('1.2K');
  });

  it('non-finite numeric renders "-" placeholder', () => {
    const wrapper = mount(ChronixStatistic, { props: { value: Number.NaN } });
    expect(wrapper.find('.cx-ui-statistic__value').text()).toBe('-');
  });
});

describe('ChronixStatistic — label + prefix/suffix slots', () => {
  it('renders __label + --with-label when label is supplied', () => {
    const wrapper = mount(ChronixStatistic, { props: { label: 'Revenue' } });
    expect(wrapper.classes()).toContain('cx-ui-statistic--with-label');
    expect(wrapper.find('.cx-ui-statistic__label').text()).toBe('Revenue');
  });

  it('renders __prefix + --with-prefix when prefix slot supplied', () => {
    const wrapper = mount(ChronixStatistic, {
      props: { value: 1234 },
      slots: { prefix: '$' },
    });
    expect(wrapper.classes()).toContain('cx-ui-statistic--with-prefix');
    expect(wrapper.find('.cx-ui-statistic__prefix').text()).toBe('$');
  });

  it('renders __suffix + --with-suffix when suffix slot supplied', () => {
    const wrapper = mount(ChronixStatistic, {
      props: { value: 1234 },
      slots: { suffix: 'USD' },
    });
    expect(wrapper.classes()).toContain('cx-ui-statistic--with-suffix');
    expect(wrapper.find('.cx-ui-statistic__suffix').text()).toBe('USD');
  });
});

describe('ChronixStatistic — tabular-nums modifier', () => {
  it('omits --tabular-nums when tabularNums=false', () => {
    const wrapper = mount(ChronixStatistic, { props: { tabularNums: false } });
    expect(wrapper.classes()).not.toContain('cx-ui-statistic--tabular-nums');
  });
});

describe('ChronixStatistic — CSS injection', () => {
  it('mounting ensures the chronix-statistic stylesheet is in document.head', () => {
    mount(ChronixStatistic);
    expect(document.head.querySelector('style[data-chronix-ui="statistic"]')).not.toBeNull();
  });
});
