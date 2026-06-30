import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChronixGantt } from './chronix-gantt.js';

import type { AxisRangePlanInput, BarSpec, RowSpec } from '@chronixjs/gantt';

const MS_PER_HOUR = 60 * 60 * 1000;

// Day-view axis anchored to 2026-05-13 (Wed) midnight. At
// viewportWidth=1440 this produces slotWidth=60 (24 hourly slots),
// so a bar spanning hours 2..6 has renderWidth = 4 * 60 = 240 px —
// comfortably past the renderWidth > 30 gate.
const anchor = new Date('2026-05-13T00:00:00');

const rows: readonly RowSpec[] = [{ id: 'r1', columns: {} }];

function bar(id: string, startHourOffset: number, endHourOffset: number, title?: string): BarSpec {
  const base: BarSpec = {
    id,
    rowId: 'r1',
    range: {
      start: new Date(anchor.getTime() + startHourOffset * MS_PER_HOUR),
      end: new Date(anchor.getTime() + endHourOffset * MS_PER_HOUR),
    },
    dprIntent: 'crisp-pixel',
  };
  return title === undefined ? base : { ...base, title };
}

const axisInput: AxisRangePlanInput = {
  viewId: 'day',
  anchorDate: anchor,
  viewportWidth: 1440,
  locale: 'zh-CN',
  weekendsVisible: true,
};

describe('<ChronixGantt> bar title auto-render', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('emits one `.cx-gantt-bar-text` per bar with a non-empty title and renderWidth > 30', () => {
    // 3 wide bars; all have titles → 3 text elements.
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('a', 0, 4, 'Alpha'), bar('b', 6, 10, 'Beta'), bar('c', 12, 16, 'Gamma')],
        rows,
        axisInput,
      },
    });
    expect(wrapper.findAll('text.cx-gantt-bar-text')).toHaveLength(3);
  });

  it('omits text for bar with no title (undefined)', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [bar('no-title', 0, 4)], rows, axisInput },
    });
    expect(wrapper.findAll('text.cx-gantt-bar-text')).toHaveLength(0);
  });

  it('omits text for bar with empty-string title', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [bar('empty-title', 0, 4, '')], rows, axisInput },
    });
    expect(wrapper.findAll('text.cx-gantt-bar-text')).toHaveLength(0);
  });

  it('omits text for very narrow bar (renderWidth <= 30)', () => {
    // 30-minute bar → 0.5 × 60 = 30 px width → fails the
    // `renderWidth > 30` gate (strict greater-than, not >=).
    const wrapper = mount(ChronixGantt, {
      props: { bars: [bar('narrow', 0, 0.5, 'Tiny')], rows, axisInput },
    });
    expect(wrapper.findAll('text.cx-gantt-bar-text')).toHaveLength(0);
  });

  it('emits the title verbatim when it fits inside the available width', () => {
    // 4-hour bar = 240 px; 8 + 4 = 12 px padding → availableWidth = 228 px.
    // At fontSize 12, avgCharWidth = 7.2, so maxChars = 31. Title "Hello"
    // is 5 chars → fits verbatim, no truncation.
    const wrapper = mount(ChronixGantt, {
      props: { bars: [bar('fit', 0, 4, 'Hello')], rows, axisInput },
    });
    const text = wrapper.find('text.cx-gantt-bar-text');
    expect(text.exists()).toBe(true);
    expect(text.text()).toBe('Hello');
  });

  it('truncates with `...` ellipsis when title overflows available width', () => {
    // 1-hour bar = 60 px; 8 + 4 = 12 px padding → availableWidth = 48 px.
    // maxChars = floor(48 / 7.2) = 6. 20-char title → truncate to
    // 6 - 3 = 3 chars + "..." = "012...".
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('long', 0, 1, '01234567890123456789')],
        rows,
        axisInput,
      },
    });
    const text = wrapper.find('text.cx-gantt-bar-text');
    expect(text.exists()).toBe(true);
    expect(text.text()).toBe('012...');
  });

  it('title x = `renderX + 8` (default left padding) when bar.isStart=true', () => {
    // Bar at hours 0..4 → placedBar.x = 0, renderWidth = 240, isStart=true
    // (bar starts at axis start). Title x should be 0 + 8 = 8.
    const wrapper = mount(ChronixGantt, {
      props: { bars: [bar('aligned', 0, 4, 'Title')], rows, axisInput },
    });
    const text = wrapper.find('text.cx-gantt-bar-text');
    expect(text.exists()).toBe(true);
    expect(Number(text.attributes('x'))).toBe(8);
  });

  it('title x shifts right by `1 + 6 + 4 = 11` px when bar.isStart=false (continuation triangle present)', () => {
    // Bar at hours -2..4 (starts before axis) → isStart=false.
    // placedBar.x = -2 * 60 = -120. Title x = -120 + 11 = -109.
    const wrapper = mount(ChronixGantt, {
      props: { bars: [bar('overflowed-start', -2, 4, 'Title')], rows, axisInput },
    });
    const text = wrapper.find('text.cx-gantt-bar-text');
    expect(text.exists()).toBe(true);
    expect(Number(text.attributes('x'))).toBe(-109);
  });

  it('title font-size / font-weight / fill reflect resolved style cascade (theme defaults when no callback)', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [bar('themed', 0, 4, 'Title')], rows, axisInput },
    });
    const text = wrapper.find('text.cx-gantt-bar-text');
    expect(text.exists()).toBe(true);
    // Default theme: barFontSize=12, barFontWeight=400, barTextColor='#ffffff'.
    expect(text.attributes('font-size')).toBe('12');
    expect(text.attributes('font-weight')).toBe('400');
    expect(text.attributes('fill')).toBe('#ffffff');
  });

  it('barFontSizeCallback returning 16 emits `<text font-size="16">`', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('large', 0, 4, 'Big')],
        rows,
        axisInput,
        barFontSizeCallback: () => 16,
      },
    });
    const text = wrapper.find('text.cx-gantt-bar-text');
    expect(text.attributes('font-size')).toBe('16');
  });

  it('barFontWeightCallback returning 700 emits `<text font-weight="700">`', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('bold', 0, 4, 'Bold')],
        rows,
        axisInput,
        barFontWeightCallback: () => 700,
      },
    });
    const text = wrapper.find('text.cx-gantt-bar-text');
    expect(text.attributes('font-weight')).toBe('700');
  });

  it('title has `pointer-events: none` (no hit-test interference)', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [bar('inert', 0, 4, 'X')], rows, axisInput },
    });
    const text = wrapper.find('text.cx-gantt-bar-text');
    expect(text.attributes('pointer-events')).toBe('none');
  });
});
