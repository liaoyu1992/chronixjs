import { describe, expect, it } from 'vitest';

import { defaultChronixTheme } from '../api/chronix-theme.js';

import { computeCellStateMeta } from './cell-state-classes.js';
import { createSlotRegistry } from './create-slot-registry.js';
import { HEADER_CELL_SLOT_NAME, type HeaderCellSlotArgs } from './header-cell-slot.js';

import type { SlotTemplate } from './slot.js';
import type { AxisHeaderCell, AxisTick } from '../layout/types.js';

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

describe('HEADER_CELL_SLOT_NAME + HeaderCellSlotArgs', () => {
  it('exports HEADER_CELL_SLOT_NAME as the literal "header-cell" constant', () => {
    expect(HEADER_CELL_SLOT_NAME).toBe('header-cell');
  });

  it('HeaderCellSlotArgs type-checks the required fields (band-cell invocation)', () => {
    const cell: AxisHeaderCell = { x: 0, width: 480, label: 'May 2026' };
    const args: HeaderCellSlotArgs = {
      bandIndex: 1,
      cellIndex: 0,
      x: 0,
      y: 0,
      width: 480,
      height: 30,
      label: 'May 2026',
      // Band cells spanning multiple days carry no date / dayMeta.
      date: undefined,
      dayMeta: undefined,
      theme: defaultChronixTheme,
      cell,
    };
    expect(args.bandIndex).toBe(1);
    expect(args.cell?.label).toBe('May 2026');
    expect(args.tick).toBeUndefined();
    expect(args.date).toBeUndefined();
  });

  it('HeaderCellSlotArgs type-checks the required fields (tick-row invocation)', () => {
    const today = startOfDay(new Date('2026-05-13T00:00:00'));
    const tickTime = new Date('2026-05-13T08:00:00');
    const tick: AxisTick = { x: 480, time: tickTime, label: '13日三' };
    const dayMeta = computeCellStateMeta(tickTime, today);
    const args: HeaderCellSlotArgs = {
      bandIndex: 0,
      cellIndex: 7,
      x: 480,
      y: 30,
      width: 65,
      height: 24,
      label: '13日三',
      date: tickTime,
      dayMeta,
      theme: defaultChronixTheme,
      tick,
      extraClasses: ['weekend-skipped'],
    };
    expect(args.bandIndex).toBe(0);
    expect(args.dayMeta?.isToday).toBe(true);
    expect(args.tick?.label).toBe('13日三');
    expect(args.cell).toBeUndefined();
    expect(args.extraClasses).toEqual(['weekend-skipped']);
  });

  it('slotRegistry.register(HEADER_CELL_SLOT_NAME, ...) round-trips like the bar / link slot', () => {
    const registry = createSlotRegistry();
    expect(registry.get(HEADER_CELL_SLOT_NAME)).toBeUndefined();

    // Sentinel return so this test doesn't depend on a framework's
    // VNode type. The slot system stores templates opaquely; reading
    // back identity-equality is all this layer guarantees.
    const sentinel = { type: 'sentinel-vnode' };
    const template: SlotTemplate = () => sentinel;
    registry.register(HEADER_CELL_SLOT_NAME, template);
    const back = registry.get(HEADER_CELL_SLOT_NAME);
    expect(back).toBe(template);

    registry.unregister(HEADER_CELL_SLOT_NAME);
    expect(registry.get(HEADER_CELL_SLOT_NAME)).toBeUndefined();
  });
});
