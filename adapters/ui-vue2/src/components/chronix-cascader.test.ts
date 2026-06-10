import { resetPopupZIndexForTests, type SelectOption } from '@chronixjs/ui';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ChronixCascader } from './chronix-cascader.js';

import type { VueConstructor } from 'vue';

const C = ChronixCascader as unknown as VueConstructor;

const CASCADE_OPTS: readonly SelectOption[] = [
  {
    key: 'zhejiang',
    label: 'Zhejiang',
    children: [{ key: 'hangzhou', label: 'Hangzhou', value: 'hangzhou' }],
  },
  {
    key: 'jiangsu',
    label: 'Jiangsu',
    children: [{ key: 'nanjing', label: 'Nanjing', value: 'nanjing' }],
  },
];

describe('ChronixCascader (vue2)', () => {
  beforeEach(() => {
    resetPopupZIndexForTests();
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders root with data-testid cascader-root', () => {
    const wrapper = mount(C, {
      attachTo: document.body,
      propsData: { options: CASCADE_OPTS },
    });
    expect(wrapper.find('[data-testid="cascader-root"]').exists()).toBe(true);
    wrapper.destroy();
  });

  it('shows root-level options when open', () => {
    const wrapper = mount(C, {
      attachTo: document.body,
      propsData: { options: CASCADE_OPTS, show: true },
    });
    const dropdown = document.querySelector('[data-testid="cascader-dropdown-popup"]');
    expect(dropdown).not.toBeNull();
    expect(dropdown!.querySelectorAll('.cx-ui-cascader__option')).toHaveLength(2);
    wrapper.destroy();
  });

  it('injects the chronix-cascader stylesheet', () => {
    const wrapper = mount(C, {
      attachTo: document.body,
      propsData: { options: CASCADE_OPTS },
    });
    expect(document.head.querySelector('style[data-chronix-ui="cascader"]')).not.toBeNull();
    wrapper.destroy();
  });
});
