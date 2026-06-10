import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixCalendar } from './chronix-calendar.js';

import type { VueConstructor } from 'vue';

const CalendarCtor = ChronixCalendar as unknown as VueConstructor;

describe('ChronixCalendar (Vue 2)', () => {
  it('renders root element with correct class', () => {
    const wrapper = mount(CalendarCtor);
    expect(wrapper.find('.cx-ui-calendar').exists()).toBe(true);
    expect(wrapper.find('[data-testid="calendar-root"]').exists()).toBe(true);
  });

  it('renders weekday headers', () => {
    const wrapper = mount(CalendarCtor);
    expect(wrapper.findAll('.cx-ui-calendar__weekday')).toHaveLength(7);
  });

  it('renders day cells (42 in grid)', () => {
    const wrapper = mount(CalendarCtor);
    expect(wrapper.findAll('.cx-ui-calendar__day')).toHaveLength(42);
  });
});
