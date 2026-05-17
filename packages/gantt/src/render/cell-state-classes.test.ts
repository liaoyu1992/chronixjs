import { describe, expect, it } from 'vitest';

import {
  DAY_IDS,
  computeCellStateMeta,
  getDayClassNames,
  getSlotClassNames,
} from './cell-state-classes.js';

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

describe('Phase 29 — DAY_IDS', () => {
  it('exports the Sun-anchored 7-element literal matching the parity-reference', () => {
    // Verbatim from k-ui's datelib/marker.ts DAY_IDS — consumers porting
    // CSS selectors map 1:1 (`.gantt-day-sat` → `.cx-gantt-day-sat`).
    expect(DAY_IDS).toEqual(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']);
  });

  it('indexes by Date.getDay() (Sun=0, Sat=6)', () => {
    // Sunday: 2026-05-10. getDay() === 0 → 'sun'.
    expect(DAY_IDS[new Date('2026-05-10T12:00:00').getDay()]).toBe('sun');
    // Wednesday: 2026-05-13. getDay() === 3 → 'wed'.
    expect(DAY_IDS[new Date('2026-05-13T12:00:00').getDay()]).toBe('wed');
    // Saturday: 2026-05-16. getDay() === 6 → 'sat'.
    expect(DAY_IDS[new Date('2026-05-16T12:00:00').getDay()]).toBe('sat');
  });
});

describe('Phase 29 — computeCellStateMeta', () => {
  it('returns the correct dayId for a known date (2026-05-13 = Wednesday)', () => {
    const today = startOfDay(new Date('2026-05-13T08:00:00'));
    const meta = computeCellStateMeta(new Date('2026-05-13T08:00:00'), today);
    expect(meta.dayId).toBe('wed');
  });

  it("sets isToday=true when date falls within today's calendar day (any time-of-day)", () => {
    const today = startOfDay(new Date('2026-05-13T00:00:00'));
    expect(computeCellStateMeta(new Date('2026-05-13T00:00:00'), today).isToday).toBe(true);
    expect(computeCellStateMeta(new Date('2026-05-13T12:30:00'), today).isToday).toBe(true);
    expect(computeCellStateMeta(new Date('2026-05-13T23:59:59'), today).isToday).toBe(true);
  });

  it("sets isToday=false outside today's calendar day", () => {
    const today = startOfDay(new Date('2026-05-13T00:00:00'));
    // Just before today starts.
    expect(computeCellStateMeta(new Date('2026-05-12T23:59:59'), today).isToday).toBe(false);
    // Tomorrow.
    expect(computeCellStateMeta(new Date('2026-05-14T00:00:00'), today).isToday).toBe(false);
  });

  it('sets isPast/isFuture mutually exclusive with isToday', () => {
    const today = startOfDay(new Date('2026-05-13T00:00:00'));
    const pastMeta = computeCellStateMeta(new Date('2026-05-01T00:00:00'), today);
    expect(pastMeta.isPast).toBe(true);
    expect(pastMeta.isFuture).toBe(false);
    expect(pastMeta.isToday).toBe(false);

    const futureMeta = computeCellStateMeta(new Date('2026-05-20T00:00:00'), today);
    expect(futureMeta.isPast).toBe(false);
    expect(futureMeta.isFuture).toBe(true);
    expect(futureMeta.isToday).toBe(false);

    const todayMeta = computeCellStateMeta(new Date('2026-05-13T15:00:00'), today);
    expect(todayMeta.isPast).toBe(false);
    expect(todayMeta.isFuture).toBe(false);
    expect(todayMeta.isToday).toBe(true);
  });
});

describe('Phase 29 — getDayClassNames', () => {
  it('returns base + dayId class as the minimum set', () => {
    const today = startOfDay(new Date('2026-05-13T00:00:00'));
    const futureMeta = computeCellStateMeta(new Date('2026-06-01T00:00:00'), today);
    // 2026-06-01 = Monday → 'mon'. Future, so we also have `-future`.
    const classes = getDayClassNames(futureMeta);
    expect(classes).toContain('cx-gantt-day');
    expect(classes).toContain('cx-gantt-day-mon');
  });

  it('appends -today / -past / -future modifiers when applicable', () => {
    const today = startOfDay(new Date('2026-05-13T00:00:00'));
    expect(
      getDayClassNames(computeCellStateMeta(new Date('2026-05-13T12:00:00'), today)),
    ).toContain('cx-gantt-day-today');
    expect(
      getDayClassNames(computeCellStateMeta(new Date('2026-05-01T12:00:00'), today)),
    ).toContain('cx-gantt-day-past');
    expect(
      getDayClassNames(computeCellStateMeta(new Date('2026-06-01T12:00:00'), today)),
    ).toContain('cx-gantt-day-future');
  });

  it('NEVER emits cx-gantt-day-other (architectural rejection — chronix-timeline vs k-ui-calendar-grid)', () => {
    const today = startOfDay(new Date('2026-05-13T00:00:00'));
    for (const date of [
      new Date('2026-05-01T00:00:00'),
      new Date('2026-05-13T12:00:00'),
      new Date('2026-05-31T23:59:59'),
      new Date('2026-06-15T12:00:00'),
    ]) {
      expect(getDayClassNames(computeCellStateMeta(date, today))).not.toContain(
        'cx-gantt-day-other',
      );
    }
  });
});

describe('Phase 29 — getSlotClassNames', () => {
  it('returns base + dayId class as the minimum set', () => {
    const today = startOfDay(new Date('2026-05-13T00:00:00'));
    // 2026-05-13 = Wednesday.
    const meta = computeCellStateMeta(new Date('2026-05-13T08:00:00'), today);
    const classes = getSlotClassNames(meta);
    expect(classes).toContain('cx-gantt-slot');
    expect(classes).toContain('cx-gantt-slot-wed');
  });

  it('appends -today / -past / -future modifiers when applicable', () => {
    const today = startOfDay(new Date('2026-05-13T00:00:00'));
    expect(
      getSlotClassNames(computeCellStateMeta(new Date('2026-05-13T08:00:00'), today)),
    ).toContain('cx-gantt-slot-today');
    expect(
      getSlotClassNames(computeCellStateMeta(new Date('2026-05-01T08:00:00'), today)),
    ).toContain('cx-gantt-slot-past');
    expect(
      getSlotClassNames(computeCellStateMeta(new Date('2026-06-01T08:00:00'), today)),
    ).toContain('cx-gantt-slot-future');
  });

  it('NEVER emits cx-gantt-slot-other (matches k-ui getSlotClassNames intentional omission)', () => {
    const today = startOfDay(new Date('2026-05-13T00:00:00'));
    for (const date of [
      new Date('2026-05-01T00:00:00'),
      new Date('2026-05-13T12:00:00'),
      new Date('2026-06-15T12:00:00'),
    ]) {
      expect(getSlotClassNames(computeCellStateMeta(date, today))).not.toContain(
        'cx-gantt-slot-other',
      );
    }
  });
});
