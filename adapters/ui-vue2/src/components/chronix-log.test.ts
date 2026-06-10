import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixLog } from './chronix-log.js';

const Log = ChronixLog as unknown as VueConstructor;

const LINES = ['first line', 'second line', 'third line'];

describe('ChronixLog (vue2) — root rendering', () => {
  it('renders a <div> with the base class only by default', () => {
    const wrapper = mount(Log, { propsData: { lines: LINES } });
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-log');
    expect(wrapper.classes()).not.toContain('cx-ui-log--with-line-numbers');
    expect(wrapper.classes()).not.toContain('cx-ui-log--loading');
    expect(wrapper.classes()).not.toContain('cx-ui-log--wrap-lines');
  });

  it('renders the __lines container as an <ol>', () => {
    const wrapper = mount(Log, { propsData: { lines: LINES } });
    const linesEl = wrapper.find('.cx-ui-log__lines').element;
    expect(linesEl.tagName).toBe('OL');
  });

  it('renders one <li> per lines entry with the text content', () => {
    const wrapper = mount(Log, { propsData: { lines: LINES } });
    const items = wrapper.findAll('.cx-ui-log__line');
    expect(items).toHaveLength(LINES.length);
    for (let i = 0; i < LINES.length; i += 1) {
      expect(items.at(i).find('.cx-ui-log__line-content').text()).toBe(LINES[i]);
    }
  });
});

describe('ChronixLog (vue2) — lineNumbers', () => {
  it('renders no __line-number span by default', () => {
    const wrapper = mount(Log, { propsData: { lines: LINES } });
    expect(wrapper.findAll('.cx-ui-log__line-number')).toHaveLength(0);
  });

  it('renders __line-number text 1..N when lineNumbers=true', () => {
    const wrapper = mount(Log, {
      propsData: { lines: LINES, lineNumbers: true },
    });
    expect(wrapper.classes()).toContain('cx-ui-log--with-line-numbers');
    const numbers = wrapper.findAll('.cx-ui-log__line-number');
    expect(numbers).toHaveLength(LINES.length);
    for (let i = 0; i < LINES.length; i += 1) {
      expect(numbers.at(i).text()).toBe(String(i + 1));
      expect(numbers.at(i).attributes('aria-hidden')).toBe('true');
    }
  });
});

describe('ChronixLog (vue2) — loading row', () => {
  it('renders the __loading row when loading=true', () => {
    const wrapper = mount(Log, {
      propsData: { lines: LINES, loading: true },
    });
    expect(wrapper.classes()).toContain('cx-ui-log--loading');
    const loading = wrapper.find('.cx-ui-log__loading');
    expect(loading.exists()).toBe(true);
    expect(loading.text()).toBe('loading...');
  });

  it('omits the __loading row by default', () => {
    const wrapper = mount(Log, { propsData: { lines: LINES } });
    expect(wrapper.find('.cx-ui-log__loading').exists()).toBe(false);
  });
});

describe('ChronixLog (vue2) — maxHeight inline style', () => {
  it('sets style.maxHeight and overflow when maxHeight is defined', () => {
    const wrapper = mount(Log, {
      propsData: { lines: LINES, maxHeight: 200 },
    });
    const style = (wrapper.element as HTMLElement).style;
    expect(style.maxHeight).toBe('200px');
    expect(style.overflow).toBe('auto');
  });

  it('does not set maxHeight or overflow when maxHeight is undefined', () => {
    const wrapper = mount(Log, { propsData: { lines: LINES } });
    const style = (wrapper.element as HTMLElement).style;
    expect(style.maxHeight).toBe('');
    expect(style.overflow).toBe('');
  });
});

describe('ChronixLog (vue2) — wrapLines', () => {
  it('adds --wrap-lines modifier when wrapLines=true', () => {
    const wrapper = mount(Log, {
      propsData: { lines: LINES, wrapLines: true },
    });
    expect(wrapper.classes()).toContain('cx-ui-log--wrap-lines');
  });
});

describe('ChronixLog (vue2) — CSS injection', () => {
  it('mounting ensures the chronix-log stylesheet is in document.head', () => {
    mount(Log, { propsData: { lines: LINES } });
    expect(document.head.querySelector('style[data-chronix-ui="log"]')).not.toBeNull();
  });
});
