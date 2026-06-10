import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixCode } from './chronix-code.js';

describe('ChronixCode (vue3)', () => {
  it('renders <pre><code> for block mode (default)', () => {
    const wrapper = mount(ChronixCode, { props: { value: 'console.log(1);' } });
    expect((wrapper.element as HTMLElement).tagName).toBe('PRE');
    expect(wrapper.classes()).toContain('cx-ui-code--block');
    expect(wrapper.find('code').exists()).toBe(true);
    expect(wrapper.text()).toBe('console.log(1);');
  });

  it('renders <code> only for inline mode', () => {
    const wrapper = mount(ChronixCode, { props: { value: 'x = 1', inline: true } });
    expect((wrapper.element as HTMLElement).tagName).toBe('CODE');
    expect(wrapper.classes()).toContain('cx-ui-code--inline');
    expect(wrapper.text()).toBe('x = 1');
  });

  it('injects the chronix-code stylesheet', () => {
    mount(ChronixCode);
    expect(document.head.querySelector('style[data-chronix-ui="code"]')).not.toBeNull();
  });
});
