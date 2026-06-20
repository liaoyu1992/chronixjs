import {
  LINK_SLOT_NAME,
  createSlotRegistry,
  type AxisRangePlanInput,
  type BarSpec,
  type LinkSlotArgs,
  type LinkSpec,
  type RowSpec,
} from '@chronixjs/gantt';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { h } from 'vue';

import { ChronixGantt } from './chronix-gantt.js';

const MS_PER_HOUR = 60 * 60 * 1000;
const anchor = new Date('2026-05-13T00:00:00');
const rows: readonly RowSpec[] = [
  { id: 'r1', columns: {} },
  { id: 'r2', columns: {} },
];

function bar(id: string, rowId: string, hourStart: number, hourEnd: number): BarSpec {
  return {
    id,
    rowId,
    range: {
      start: new Date(anchor.getTime() + hourStart * MS_PER_HOUR),
      end: new Date(anchor.getTime() + hourEnd * MS_PER_HOUR),
    },
    dprIntent: 'crisp-pixel',
  };
}

const axisInput: AxisRangePlanInput = {
  viewId: 'day',
  anchorDate: anchor,
  viewportWidth: 1440,
  locale: 'zh-CN',
  weekendsVisible: true,
};

function link(id: string, fromBarId: string, toBarId: string): LinkSpec {
  return { id, fromBarId, toBarId, routing: 'square', marker: 'arrow' };
}

describe('<ChronixGantt> link slot — Phase 28.3', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('no link slot registered → default `<path class="cx-gantt-link">` renders', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('a', 'r1', 0, 4), bar('b', 'r2', 6, 10)],
        rows,
        axisInput,
        links: [link('l-1', 'a', 'b')],
      },
    });
    expect(wrapper.findAll('path.cx-gantt-link')).toHaveLength(1);
  });

  it('registered link slot invokes once per routed link with full LinkSlotArgs', () => {
    const seenArgs: LinkSlotArgs[] = [];
    const registry = createSlotRegistry();
    registry.register(LINK_SLOT_NAME, (ctx) => {
      // ctx.args is `Readonly<Record<string, unknown>>` per the
      // chronix-cross-framework slot contract; the consumer
      // narrows by recasting to `LinkSlotArgs`.
      const args = ctx.args as unknown as LinkSlotArgs;
      seenArgs.push(args);
      return h('rect', {
        'data-test-slot-link-id': args.routedLink.linkId,
        x: 0,
        y: 0,
        width: 1,
        height: 1,
      });
    });
    mount(ChronixGantt, {
      props: {
        bars: [bar('a', 'r1', 0, 4), bar('b', 'r2', 6, 10)],
        rows,
        axisInput,
        links: [link('l-1', 'a', 'b'), link('l-2', 'b', 'a')],
        slotRegistry: registry,
      },
    });
    expect(seenArgs).toHaveLength(2);
    expect(seenArgs[0]!.routedLink.linkId).toBe('l-1');
    expect(seenArgs[0]!.linkSpec.fromBarId).toBe('a');
    expect(seenArgs[0]!.fromBar.barId).toBe('a');
    expect(seenArgs[0]!.toBar.barId).toBe('b');
    expect(typeof seenArgs[0]!.theme.linkStrokeWidth).toBe('number');
  });

  it('slot template VNode replaces the default `<path class="cx-gantt-link">`', () => {
    const registry = createSlotRegistry();
    registry.register(LINK_SLOT_NAME, (ctx) => {
      const args = ctx.args as unknown as LinkSlotArgs;
      return h('rect', {
        class: 'cx-test-custom-link',
        'data-link-id': args.routedLink.linkId,
        x: 0,
        y: 0,
        width: 1,
        height: 1,
      });
    });
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('a', 'r1', 0, 4), bar('b', 'r2', 6, 10)],
        rows,
        axisInput,
        links: [link('l-1', 'a', 'b')],
        slotRegistry: registry,
      },
    });
    // The default link path should NOT render when a slot is set;
    // the custom rect appears in its place.
    expect(wrapper.findAll('path.cx-gantt-link')).toHaveLength(0);
    expect(wrapper.findAll('rect.cx-test-custom-link')).toHaveLength(1);
  });

  it('slot args.color reflects useLineEventColor + onLineCallback resolution', () => {
    const seenColors: string[] = [];
    const registry = createSlotRegistry();
    registry.register(LINK_SLOT_NAME, (ctx) => {
      const args = ctx.args as unknown as LinkSlotArgs;
      seenColors.push(args.color);
      return null;
    });
    mount(ChronixGantt, {
      props: {
        bars: [
          {
            id: 'a',
            rowId: 'r1',
            range: {
              start: new Date(anchor.getTime()),
              end: new Date(anchor.getTime() + 4 * MS_PER_HOUR),
            },
            dprIntent: 'crisp-pixel',
            style: { backgroundColor: '#ef4444' },
          },
          bar('b', 'r2', 6, 10),
        ],
        rows,
        axisInput,
        links: [link('l-1', 'a', 'b')],
        useLineEventColor: true,
        onLineCallback: () => ({ color: '#fbbf24' }),
        slotRegistry: registry,
      },
    });
    // onLineCallback override wins over useLineEventColor → slot sees
    // the final resolved color, not the cascade intermediates.
    expect(seenColors).toEqual(['#fbbf24']);
  });
});
