import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixTimePicker } from './chronix-time-picker.js';

import type { VueConstructor } from 'vue';

const TimePickerCtor = ChronixTimePicker as unknown as VueConstructor;

describe('ChronixTimePicker (Vue 2)', () => {
  it('renders root element with correct class', () => {
    const wrapper = mount(TimePickerCtor);
    expect(wrapper.find('.cx-ui-time-picker').exists()).toBe(true);
    expect(wrapper.find('[data-testid="time-picker-root"]').exists()).toBe(true);
  });

  it('shows placeholder when no value', () => {
    const wrapper = mount(TimePickerCtor, { propsData: { placeholder: 'Pick time' } });
    expect(wrapper.text()).toContain('Pick time');
  });

  it('shows formatted value when value is set', () => {
    const date = new Date(2026, 5, 15, 14, 30, 0);
    const wrapper = mount(TimePickerCtor, {
      propsData: { value: date, format: 'HH:mm:ss' },
    });
    expect(wrapper.text()).toContain('14:30:00');
  });

  it('adds disabled class when disabled', () => {
    const wrapper = mount(TimePickerCtor, { propsData: { disabled: true } });
    expect(wrapper.find('.cx-ui-time-picker--disabled').exists()).toBe(true);
  });
});
