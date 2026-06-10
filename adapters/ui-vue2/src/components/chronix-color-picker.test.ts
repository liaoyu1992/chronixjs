import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixColorPicker } from './chronix-color-picker.js';

import type { VueConstructor } from 'vue';

const ColorPickerCtor = ChronixColorPicker as unknown as VueConstructor;

describe('ChronixColorPicker (Vue 2)', () => {
  it('renders root element with correct class', () => {
    const wrapper = mount(ColorPickerCtor);
    expect(wrapper.find('.cx-ui-color-picker').exists()).toBe(true);
    expect(wrapper.find('[data-testid="color-picker-root"]').exists()).toBe(true);
  });

  it('renders trigger with color preview', () => {
    const wrapper = mount(ColorPickerCtor, { propsData: { value: '#ff0000' } });
    const trigger = wrapper.find('[data-testid="color-picker-trigger"]');
    expect(trigger.exists()).toBe(true);
  });

  it('shows panel on trigger click', async () => {
    const wrapper = mount(ColorPickerCtor);
    await wrapper.find('[data-testid="color-picker-trigger"]').trigger('click');
    const panel = wrapper.find('[data-testid="color-picker-panel"]');
    expect(panel.exists()).toBe(true);
  });

  it('injects the chronix-color-picker stylesheet', () => {
    mount(ColorPickerCtor);
    const style = document.head.querySelector('style[data-chronix-ui="color-picker"]');
    expect(style).not.toBeNull();
  });
});
