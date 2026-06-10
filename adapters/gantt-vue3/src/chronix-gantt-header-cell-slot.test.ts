import { HEADER_CELL_SLOT_NAME, createSlotRegistry } from '@chronixjs/gantt';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { h } from 'vue';

import { ChronixGantt } from './chronix-gantt.js';

import type {
  AxisRangePlanInput,
  HeaderCellSlotArgs,
  RowSpec,
  SlotRegistry,
} from '@chronixjs/gantt';

const anchor = new Date('2026-05-13T00:00:00');
const rows: readonly RowSpec[] = [{ id: 'r1', columns: {} }];

const weekAxis: AxisRangePlanInput = {
  viewId: 'week',
  anchorDate: anchor,
  viewportWidth: 1440,
  locale: 'zh-CN',
  weekendsVisible: true,
};

describe('<ChronixGantt> "header-cell" slot — Phase 29', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-13T08:00:00'));
  });

  afterEach(() => {
    warnSpy.mockRestore();
    vi.useRealTimers();
  });

  it('no slot registered → emits default <rect>+<text> pair per outer band cell + default <text> per tick', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput: weekAxis },
    });
    // 7 outer band cells.
    expect(wrapper.findAll('rect.cx-gantt-header-cell').length).toBe(7);
    expect(wrapper.findAll('text.cx-gantt-header-cell-label').length).toBe(7);
    // 168 tick labels.
    expect(wrapper.findAll('text.cx-gantt-tick-label').length).toBe(168);
  });

  it('registered slot template replaces both outer band and tick row cell content', () => {
    const registry: SlotRegistry = createSlotRegistry();
    registry.register(HEADER_CELL_SLOT_NAME, (ctx) => {
      const args = ctx.args as unknown as HeaderCellSlotArgs;
      // Single sentinel `<rect>` carrying a stable class so the test
      // can count slot-replaced cells without false matches against
      // chronix's own elements.
      return h('rect', {
        class: 'custom-header-cell',
        'data-band': String(args.bandIndex),
        'data-cell': String(args.cellIndex),
        x: args.x,
        y: args.y,
        width: args.width,
        height: args.height,
      });
    });

    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput: weekAxis, slotRegistry: registry },
    });
    // No default outer band rects emitted (slot replaced).
    expect(wrapper.findAll('rect.cx-gantt-header-cell').length).toBe(0);
    expect(wrapper.findAll('text.cx-gantt-header-cell-label').length).toBe(0);
    // No default tick labels emitted (slot replaced).
    expect(wrapper.findAll('text.cx-gantt-tick-label').length).toBe(0);
    // 7 outer band + 168 tick = 175 custom cells.
    expect(wrapper.findAll('rect.custom-header-cell').length).toBe(7 + 168);
  });

  it('slot template invocation receives HeaderCellSlotArgs with correct geometry + dayMeta', () => {
    const captured: HeaderCellSlotArgs[] = [];
    const registry: SlotRegistry = createSlotRegistry();
    registry.register(HEADER_CELL_SLOT_NAME, (ctx) => {
      captured.push(ctx.args as unknown as HeaderCellSlotArgs);
      return h('rect', { x: 0, y: 0, width: 0, height: 0 });
    });

    mount(ChronixGantt, {
      props: { bars: [], rows, axisInput: weekAxis, slotRegistry: registry },
    });
    expect(captured.length).toBe(7 + 168);
    // First captured invocation is an outer band cell (bandIndex=1).
    const bandCall = captured.find((c) => c.bandIndex === 1 && c.cellIndex === 0);
    expect(bandCall).toBeDefined();
    expect(bandCall!.width).toBeGreaterThan(0);
    // Outer band day cell on Monday → eligible for dayMeta.
    expect(bandCall!.dayMeta?.dayId).toBe('mon');
    // Tick row Wed-noon invocation (around middle of week, hourly slot).
    const tickCall = captured.find((c) => c.bandIndex === 0 && c.tick !== undefined);
    expect(tickCall).toBeDefined();
    // Tick row in week view is hourly → not day-eligible.
    expect(tickCall!.dayMeta).toBeUndefined();
    expect(tickCall!.tick?.label).toBeDefined();
  });

  it('slot args.extraClasses surfaces any headerCellClassNamesCallback output', () => {
    const captured: HeaderCellSlotArgs[] = [];
    const registry: SlotRegistry = createSlotRegistry();
    registry.register(HEADER_CELL_SLOT_NAME, (ctx) => {
      captured.push(ctx.args as unknown as HeaderCellSlotArgs);
      return h('rect', { x: 0, y: 0, width: 0, height: 0 });
    });

    mount(ChronixGantt, {
      props: {
        bars: [],
        rows,
        axisInput: weekAxis,
        slotRegistry: registry,
        headerCellClassNamesCallback: (arg) =>
          arg.dayMeta?.dayId === 'sat' ? ['weekend-marker'] : undefined,
      },
    });
    // Saturday outer band cell receives extraClasses populated.
    const satBandCall = captured.find((c) => c.bandIndex === 1 && c.dayMeta?.dayId === 'sat');
    expect(satBandCall?.extraClasses).toEqual(['weekend-marker']);
    // Monday outer band cell receives empty extraClasses.
    const monBandCall = captured.find((c) => c.bandIndex === 1 && c.dayMeta?.dayId === 'mon');
    expect(monBandCall?.extraClasses).toEqual([]);
  });
});
