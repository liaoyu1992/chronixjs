import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixDatePicker } from './chronix-date-picker.js';

describe('ChronixDatePicker (Vue 3)', () => {
  it('renders root element with correct class', () => {
    const wrapper = mount(ChronixDatePicker);
    expect(wrapper.find('.cx-ui-date-picker').exists()).toBe(true);
    expect(wrapper.find('[data-testid="date-picker-root"]').exists()).toBe(true);
  });

  it('shows placeholder when no value', () => {
    const wrapper = mount(ChronixDatePicker, { props: { placeholder: 'Pick a date' } });
    expect(wrapper.text()).toContain('Pick a date');
  });

  it('shows formatted value when value is set', () => {
    const date = new Date(2026, 5, 15);
    const wrapper = mount(ChronixDatePicker, { props: { value: date, format: 'yyyy-MM-dd' } });
    expect(wrapper.text()).toContain('2026-06-15');
  });

  it('adds disabled class when disabled', () => {
    const wrapper = mount(ChronixDatePicker, { props: { disabled: true } });
    expect(wrapper.find('.cx-ui-date-picker--disabled').exists()).toBe(true);
  });
});
