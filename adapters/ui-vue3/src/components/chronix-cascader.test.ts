import { resetPopupZIndexForTests, type SelectOption } from '@chronixjs/ui';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ChronixCascader } from './chronix-cascader.js';

const CASCADE_OPTS: readonly SelectOption[] = [
  {
    key: 'zhejiang',
    label: 'Zhejiang',
    children: [
      { key: 'hangzhou', label: 'Hangzhou', value: 'hangzhou' },
      { key: 'ningbo', label: 'Ningbo', value: 'ningbo' },
    ],
  },
  {
    key: 'jiangsu',
    label: 'Jiangsu',
    children: [{ key: 'nanjing', label: 'Nanjing', value: 'nanjing' }],
  },
];

describe('ChronixCascader (vue3)', () => {
  beforeEach(() => {
    resetPopupZIndexForTests();
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders root with data-testid cascader-root', () => {
    const wrapper = mount(ChronixCascader, {
      attachTo: document.body,
      props: { options: CASCADE_OPTS },
    });
    expect(wrapper.find('[data-testid="cascader-root"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('shows root-level options when open', () => {
    const wrapper = mount(ChronixCascader, {
      attachTo: document.body,
      props: { options: CASCADE_OPTS, show: true },
    });
    const dropdown = document.querySelector('[data-testid="cascader-dropdown-popup"]');
    expect(dropdown).not.toBeNull();
    const options = dropdown!.querySelectorAll('.cx-ui-cascader__option');
    expect(options).toHaveLength(2); // zhejiang + jiangsu at root level
    wrapper.unmount();
  });

  it('emits update:value on leaf option click', async () => {
    const wrapper = mount(ChronixCascader, {
      attachTo: document.body,
      props: { options: CASCADE_OPTS, show: true },
    });
    // First click root level to expand
    const rootOpt = document.querySelector('[data-testid="cascader-option-zhejiang"]')!;
    rootOpt.dispatchEvent(new MouseEvent('mouseenter'));
    await wrapper.vm.$nextTick();

    // Now sub-panel should have hangzhou + ningbo
    const leafOpt = document.querySelector<HTMLElement>(
      '[data-testid="cascader-option-hangzhou"]',
    )!;
    expect(leafOpt).not.toBeNull();
    leafOpt.click();
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('update:value')).toBeTruthy();
    expect(wrapper.emitted('update:value')![0]![0]).toBe('hangzhou');
    wrapper.unmount();
  });

  it('injects the chronix-cascader stylesheet', () => {
    const wrapper = mount(ChronixCascader, {
      attachTo: document.body,
      props: { options: CASCADE_OPTS },
    });
    expect(document.head.querySelector('style[data-chronix-ui="cascader"]')).not.toBeNull();
    wrapper.unmount();
  });
});
