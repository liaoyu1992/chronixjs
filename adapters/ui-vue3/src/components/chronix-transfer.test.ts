// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixTransfer } from './chronix-transfer.js';

const OPTIONS = [
  { label: 'Apple', value: 'a' },
  { label: 'Banana', value: 'b' },
  { label: 'Cherry', value: 'c' },
];

describe('ChronixTransfer (vue3)', () => {
  it('renders root element with correct class', () => {
    const wrapper = mount(ChronixTransfer, { props: { options: OPTIONS } });
    expect(wrapper.find('[data-testid="transfer-root"]').classes()).toContain('cx-ui-transfer');
  });

  it('renders source and target panels', () => {
    const wrapper = mount(ChronixTransfer, { props: { options: OPTIONS } });
    expect(wrapper.find('[data-testid="transfer-source"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="transfer-target"]').exists()).toBe(true);
  });

  it('renders items in source panel', () => {
    const wrapper = mount(ChronixTransfer, { props: { options: OPTIONS } });
    expect(wrapper.find('[data-testid="transfer-item-a"]').exists()).toBe(true);
  });

  it('injects the chronix-transfer stylesheet', () => {
    mount(ChronixTransfer, { props: { options: OPTIONS } });
    const style = document.head.querySelector('style[data-chronix-ui="transfer"]');
    expect(style).not.toBeNull();
  });
});
