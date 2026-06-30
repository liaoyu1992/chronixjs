import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChronixGantt } from './chronix-gantt.js';

import type {
  AxisRangePlanInput,
  BarSpec,
  LinkRenderArg,
  LinkSpec,
  RowSpec,
} from '@chronixjs/gantt';

const MS_PER_HOUR = 60 * 60 * 1000;
const anchor = new Date('2026-05-13T00:00:00');
const rows: readonly RowSpec[] = [
  { id: 'r1', columns: {} },
  { id: 'r2', columns: {} },
];

function bar(
  id: string,
  rowId: string,
  startHourOffset: number,
  endHourOffset: number,
  style?: BarSpec['style'],
): BarSpec {
  const base: BarSpec = {
    id,
    rowId,
    range: {
      start: new Date(anchor.getTime() + startHourOffset * MS_PER_HOUR),
      end: new Date(anchor.getTime() + endHourOffset * MS_PER_HOUR),
    },
    dprIntent: 'crisp-pixel',
  };
  return style === undefined ? base : { ...base, style };
}

const axisInput: AxisRangePlanInput = {
  viewId: 'day',
  anchorDate: anchor,
  viewportWidth: 1440,
  locale: 'zh-CN',
  weekendsVisible: true,
};

function link(
  id: string,
  fromBarId: string,
  toBarId: string,
  extras: Partial<LinkSpec> = {},
): LinkSpec {
  return {
    id,
    fromBarId,
    toBarId,
    routing: 'square',
    marker: 'arrow',
    ...extras,
  };
}

describe('<ChronixGantt> useLineEventColor + onLineCallback', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('useLineEventColor: true makes link stroke inherit source bar resolved bg color', () => {
    // Bar A's style sets bg to #ef4444 → that color flows through
    // cascade to the link as its stroke.
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('a', 'r1', 0, 4, { backgroundColor: '#ef4444' }), bar('b', 'r2', 6, 10)],
        rows,
        axisInput,
        links: [link('l-1', 'a', 'b')],
        useLineEventColor: true,
      },
    });
    const path = wrapper.find('path.cx-gantt-link');
    expect(path.exists()).toBe(true);
    expect(path.attributes('stroke')).toBe('#ef4444');
  });

  it('useLineEventColor: false falls back to theme.linkDefaultColor', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('a', 'r1', 0, 4, { backgroundColor: '#ef4444' }), bar('b', 'r2', 6, 10)],
        rows,
        axisInput,
        links: [link('l-1', 'a', 'b')],
        useLineEventColor: false,
      },
    });
    const path = wrapper.find('path.cx-gantt-link');
    // theme.linkDefaultColor default = #3788d8.
    expect(path.attributes('stroke')).toBe('#3788d8');
  });

  it('LinkSpec.colorOverride wins over useLineEventColor', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('a', 'r1', 0, 4, { backgroundColor: '#ef4444' }), bar('b', 'r2', 6, 10)],
        rows,
        axisInput,
        links: [link('l-1', 'a', 'b', { colorOverride: '#10b981' })],
        useLineEventColor: true,
      },
    });
    const path = wrapper.find('path.cx-gantt-link');
    expect(path.attributes('stroke')).toBe('#10b981');
  });

  it('onLineCallback returning {color} overrides the cascade', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('a', 'r1', 0, 4), bar('b', 'r2', 6, 10)],
        rows,
        axisInput,
        links: [link('l-1', 'a', 'b')],
        onLineCallback: () => ({ color: '#fbbf24' }),
      },
    });
    const path = wrapper.find('path.cx-gantt-link');
    expect(path.attributes('stroke')).toBe('#fbbf24');
  });

  it('onLineCallback returning {marker} switches the marker shape', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('a', 'r1', 0, 4), bar('b', 'r2', 6, 10)],
        rows,
        axisInput,
        links: [link('l-1', 'a', 'b', { marker: 'arrow' })],
        onLineCallback: () => ({ marker: 'diamond' }),
      },
    });
    const path = wrapper.find('path.cx-gantt-link');
    // marker-end attribute references the marker def — verify the URL
    // identifies a diamond marker rather than arrow.
    expect(path.attributes('marker-end')).toContain('cx-marker-diamond');
  });

  it('onLineCallback returning undefined leaves the cascade default intact', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('a', 'r1', 0, 4), bar('b', 'r2', 6, 10)],
        rows,
        axisInput,
        links: [link('l-1', 'a', 'b')],
        onLineCallback: () => undefined,
      },
    });
    const path = wrapper.find('path.cx-gantt-link');
    expect(path.attributes('stroke')).toBe('#3788d8');
  });

  it('onLineCallback color override wins over useLineEventColor source-bar color', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('a', 'r1', 0, 4, { backgroundColor: '#ef4444' }), bar('b', 'r2', 6, 10)],
        rows,
        axisInput,
        links: [link('l-1', 'a', 'b')],
        useLineEventColor: true,
        onLineCallback: () => ({ color: '#fbbf24' }),
      },
    });
    const path = wrapper.find('path.cx-gantt-link');
    expect(path.attributes('stroke')).toBe('#fbbf24');
  });

  it('marker def emitted for the callback-overridden color (not just the default)', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('a', 'r1', 0, 4), bar('b', 'r2', 6, 10)],
        rows,
        axisInput,
        links: [link('l-1', 'a', 'b', { marker: 'arrow' })],
        onLineCallback: () => ({ color: '#fbbf24' }),
      },
    });
    // The defs container should have a marker for the overridden
    // color (the marker-end URL the path references) — verify by
    // querying every <marker> element and confirming at least one
    // has a fill / stroke matching the override.
    const markers = wrapper.findAll('marker');
    const hasOverrideColor = markers.some((m) => m.html().toLowerCase().includes('#fbbf24'));
    expect(hasOverrideColor).toBe(true);
  });

  it('onLineCallback receives LinkRenderArg with resolved defaults', () => {
    const seen: LinkRenderArg[] = [];
    mount(ChronixGantt, {
      props: {
        bars: [bar('a', 'r1', 0, 4, { backgroundColor: '#ef4444' }), bar('b', 'r2', 6, 10)],
        rows,
        axisInput,
        links: [link('l-1', 'a', 'b', { marker: 'circle' })],
        useLineEventColor: true,
        onLineCallback: (arg) => {
          seen.push(arg);
          return undefined;
        },
      },
    });
    expect(seen).toHaveLength(1);
    const arg = seen[0]!;
    expect(arg.linkSpec.id).toBe('l-1');
    expect(arg.fromBar.barId).toBe('a');
    expect(arg.toBar.barId).toBe('b');
    // Default color reflects the useLineEventColor cascade (source bar
    // color, not the theme default).
    expect(arg.defaultColor).toBe('#ef4444');
    expect(arg.currentMarker).toBe('circle');
  });
});
