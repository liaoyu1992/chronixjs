import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixTransfer } from './chronix-transfer.js';

import type { VueConstructor } from 'vue';

const TransferCtor = ChronixTransfer as unknown as VueConstructor;

const OPTIONS = [
  { label: 'Apple', value: 'a' },
  { label: 'Banana', value: 'b' },
  { label: 'Cherry', value: 'c' },
];

describe('ChronixTransfer (Vue 2)', () => {
  it('renders root element with correct class', () => {
    const wrapper = mount(TransferCtor, { propsData: { options: OPTIONS } });
    expect(wrapper.find('.cx-ui-transfer').exists()).toBe(true);
    expect(wrapper.find('[data-testid="transfer-root"]').exists()).toBe(true);
  });

  it('renders source and target panels', () => {
    const wrapper = mount(TransferCtor, { propsData: { options: OPTIONS } });
    expect(wrapper.find('[data-testid="transfer-source"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="transfer-target"]').exists()).toBe(true);
  });

  it('renders items in source panel', () => {
    const wrapper = mount(TransferCtor, { propsData: { options: OPTIONS } });
    expect(wrapper.find('[data-testid="transfer-item-a"]').exists()).toBe(true);
  });

  it('injects the chronix-transfer stylesheet', () => {
    mount(TransferCtor, { propsData: { options: OPTIONS } });
    const style = document.head.querySelector('style[data-chronix-ui="transfer"]');
    expect(style).not.toBeNull();
  });
});
