// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixColorPicker } from './chronix-color-picker.js';

describe('ChronixColorPicker (vue3)', () => {
  it('renders root element with correct class', () => {
    const wrapper = mount(ChronixColorPicker);
    expect(wrapper.find('[data-testid="color-picker-root"]').classes()).toContain(
      'cx-ui-color-picker',
    );
  });

  it('renders trigger with color preview', () => {
    const wrapper = mount(ChronixColorPicker, { props: { value: '#ff0000' } });
    const trigger = wrapper.find('[data-testid="color-picker-trigger"]');
    expect(trigger.exists()).toBe(true);
  });

  it('shows panel on trigger click', async () => {
    const wrapper = mount(ChronixColorPicker);
    await wrapper.find('[data-testid="color-picker-trigger"]').trigger('click');
    const panel = wrapper.find('[data-testid="color-picker-panel"]');
    expect(panel.exists()).toBe(true);
  });

  it('injects the chronix-color-picker stylesheet', () => {
    mount(ChronixColorPicker);
    const style = document.head.querySelector('style[data-chronix-ui="color-picker"]');
    expect(style).not.toBeNull();
  });
});
