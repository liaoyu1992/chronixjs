import { describe, expect, it, vi } from 'vitest';

import {
  validateDrop,
  validateResize,
  validateSelect,
  type DropProposal,
  type EventConstraint,
  type ValidationContext,
} from './validation.js';

import type { BarSpec } from '../ir/index.js';

const MS_PER_HOUR = 60 * 60 * 1000;
const today = new Date('2026-05-13T00:00:00');
today.setHours(0, 0, 0, 0);
const todayMs = today.getTime();

function bar(id: string, rowId: string, startHour: number, endHour: number): BarSpec {
  return {
    id,
    rowId,
    range: {
      start: new Date(todayMs + startHour * MS_PER_HOUR),
      end: new Date(todayMs + endHour * MS_PER_HOUR),
    },
    dprIntent: 'crisp-pixel',
  };
}

function proposal(rowId: string, startHour: number, endHour: number): DropProposal {
  return {
    rowId,
    range: {
      start: new Date(todayMs + startHour * MS_PER_HOUR),
      end: new Date(todayMs + endHour * MS_PER_HOUR),
    },
  };
}

describe('validateDrop — constraint', () => {
  const constraint: EventConstraint = {
    range: {
      start: new Date(todayMs + 8 * MS_PER_HOUR),
      end: new Date(todayMs + 20 * MS_PER_HOUR),
    },
  };

  it('passes when proposed range sits fully inside the constraint window', () => {
    const movingBar = bar('m', 'r1', 10, 12);
    const result = validateDrop(proposal('r1', 10, 14), movingBar, {
      bars: [movingBar],
      eventConstraint: constraint,
    });
    expect(result).toBeNull();
  });

  it('fails with reason "constraint" when proposed range starts before the window', () => {
    const movingBar = bar('m', 'r1', 10, 12);
    const result = validateDrop(proposal('r1', 7, 9), movingBar, {
      bars: [movingBar],
      eventConstraint: constraint,
    });
    expect(result).toBe('constraint');
  });

  it('fails with reason "constraint" when proposed range ends after the window', () => {
    const movingBar = bar('m', 'r1', 10, 12);
    const result = validateDrop(proposal('r1', 18, 22), movingBar, {
      bars: [movingBar],
      eventConstraint: constraint,
    });
    expect(result).toBe('constraint');
  });

  it('passes when rowIds whitelist includes the proposed row', () => {
    const movingBar = bar('m', 'r1', 10, 12);
    const result = validateDrop(proposal('r2', 10, 14), movingBar, {
      bars: [movingBar],
      eventConstraint: { ...constraint, rowIds: ['r1', 'r2'] },
    });
    expect(result).toBeNull();
  });

  it('fails with reason "constraint" when proposed row is outside the rowIds whitelist', () => {
    const movingBar = bar('m', 'r1', 10, 12);
    const result = validateDrop(proposal('r3', 10, 14), movingBar, {
      bars: [movingBar],
      eventConstraint: { ...constraint, rowIds: ['r1', 'r2'] },
    });
    expect(result).toBe('constraint');
  });
});

describe('validateDrop — overlap', () => {
  it('passes when eventOverlap is omitted (default true)', () => {
    const movingBar = bar('m', 'r1', 10, 12);
    const otherBar = bar('o', 'r2', 11, 13);
    const result = validateDrop(proposal('r2', 11, 13), movingBar, {
      bars: [movingBar, otherBar],
    });
    expect(result).toBeNull();
  });

  it('passes when eventOverlap === true (explicit allow)', () => {
    const movingBar = bar('m', 'r1', 10, 12);
    const otherBar = bar('o', 'r2', 11, 13);
    const result = validateDrop(proposal('r2', 11, 13), movingBar, {
      bars: [movingBar, otherBar],
      eventOverlap: true,
    });
    expect(result).toBeNull();
  });

  it('fails with reason "overlap" when eventOverlap === false and a cross-row bar has intersecting time', () => {
    const movingBar = bar('m', 'r1', 10, 12);
    const otherBar = bar('o', 'r2', 11, 13);
    // Proposal stays on r1; otherBar at r2 has intersecting time. Cross-row
    // time intersect → reject when eventOverlap is false.
    const result = validateDrop(proposal('r1', 11, 13), movingBar, {
      bars: [movingBar, otherBar],
      eventOverlap: false,
    });
    expect(result).toBe('overlap');
  });

  it('allows same-row intersect even when eventOverlap === false (stack layout handles it)', () => {
    const movingBar = bar('m', 'r1', 10, 12);
    const sameRowBar = bar('s', 'r1', 11, 13);
    // Both bars on r1; proposal lands on r1 — same row, overlap skipped
    // because BarStackHeightPass stacks same-row bars vertically.
    const result = validateDrop(proposal('r1', 11, 13), movingBar, {
      bars: [movingBar, sameRowBar],
      eventOverlap: false,
    });
    expect(result).toBeNull();
  });

  it('calls eventOverlap function once per intersecting cross-row pair and respects its return value', () => {
    const movingBar = bar('m', 'r1', 10, 12);
    const otherBar = bar('o', 'r2', 11, 13);
    const overlapFunc = vi.fn().mockReturnValue(true);
    // Proposal stays on r1; otherBar on r2 → cross-row, time intersects, predicate fires.
    const passResult = validateDrop(proposal('r1', 11, 13), movingBar, {
      bars: [movingBar, otherBar],
      eventOverlap: overlapFunc,
    });
    expect(passResult).toBeNull();
    expect(overlapFunc).toHaveBeenCalledTimes(1);
    expect(overlapFunc).toHaveBeenCalledWith(
      otherBar,
      expect.objectContaining({ id: 'm', rowId: 'r1' }),
    );

    const rejectFunc = vi.fn().mockReturnValue(false);
    const failResult = validateDrop(proposal('r1', 11, 13), movingBar, {
      bars: [movingBar, otherBar],
      eventOverlap: rejectFunc,
    });
    expect(failResult).toBe('overlap');
  });
});

describe('validateDrop — eventAllow', () => {
  it('passes when eventAllow returns true', () => {
    const movingBar = bar('m', 'r1', 10, 12);
    const allowFunc = vi.fn().mockReturnValue(true);
    const result = validateDrop(proposal('r1', 14, 16), movingBar, {
      bars: [movingBar],
      eventAllow: allowFunc,
    });
    expect(result).toBeNull();
    expect(allowFunc).toHaveBeenCalledTimes(1);
    expect(allowFunc.mock.calls[0]?.[0]).toMatchObject({ rowId: 'r1' });
    expect(allowFunc.mock.calls[0]?.[1]).toBe(movingBar);
  });

  it('fails with reason "allow" when eventAllow returns false', () => {
    const movingBar = bar('m', 'r1', 10, 12);
    const allowFunc = vi.fn().mockReturnValue(false);
    const result = validateDrop(proposal('r1', 14, 16), movingBar, {
      bars: [movingBar],
      eventAllow: allowFunc,
    });
    expect(result).toBe('allow');
  });
});

describe('validateDrop — short-circuit order', () => {
  it('constraint failure short-circuits before overlap and allow are evaluated', () => {
    const movingBar = bar('m', 'r1', 10, 12);
    const otherBar = bar('o', 'r2', 5, 9);
    const overlapFunc = vi.fn().mockReturnValue(false);
    const allowFunc = vi.fn().mockReturnValue(false);
    const ctx: ValidationContext = {
      bars: [movingBar, otherBar],
      eventConstraint: {
        range: {
          start: new Date(todayMs + 8 * MS_PER_HOUR),
          end: new Date(todayMs + 20 * MS_PER_HOUR),
        },
      },
      eventOverlap: overlapFunc,
      eventAllow: allowFunc,
    };
    // Proposal 5..9 violates constraint (start < 8) — constraint
    // should fail first.
    const result = validateDrop(proposal('r2', 5, 9), movingBar, ctx);
    expect(result).toBe('constraint');
    expect(overlapFunc).not.toHaveBeenCalled();
    expect(allowFunc).not.toHaveBeenCalled();
  });

  it('overlap failure short-circuits before allow is evaluated', () => {
    const movingBar = bar('m', 'r1', 10, 12);
    const otherBar = bar('o', 'r2', 11, 13);
    const allowFunc = vi.fn().mockReturnValue(false);
    // Proposal stays on r1; otherBar on r2 → cross-row time intersect → overlap fails first.
    const result = validateDrop(proposal('r1', 11, 13), movingBar, {
      bars: [movingBar, otherBar],
      eventOverlap: false,
      eventAllow: allowFunc,
    });
    expect(result).toBe('overlap');
    expect(allowFunc).not.toHaveBeenCalled();
  });
});

describe('validateResize', () => {
  it('is the same function as validateDrop (algorithmically identical surface)', () => {
    expect(validateResize).toBe(validateDrop);
  });
});

describe('validateSelect', () => {
  const constraint: EventConstraint = {
    range: {
      start: new Date(todayMs + 8 * MS_PER_HOUR),
      end: new Date(todayMs + 20 * MS_PER_HOUR),
    },
  };

  it('passes when no validators are configured', () => {
    expect(validateSelect(proposal('r1', 10, 14), { bars: [] })).toBeNull();
  });

  it('fails with reason "constraint" when proposed range sits outside the window', () => {
    expect(
      validateSelect(proposal('r1', 18, 22), {
        bars: [],
        eventConstraint: constraint,
      }),
    ).toBe('constraint');
  });

  it('calls selectAllow and respects its return value', () => {
    const allowFunc = vi.fn().mockReturnValue(false);
    const result = validateSelect(proposal('r1', 10, 14), {
      bars: [],
      selectAllow: allowFunc,
    });
    expect(result).toBe('allow');
    expect(allowFunc).toHaveBeenCalledTimes(1);
    expect(allowFunc.mock.calls[0]?.[0]).toMatchObject({ rowId: 'r1' });
  });

  it('falls back to eventOverlap when selectOverlap is unset (Phase 55 fallback)', () => {
    // With eventOverlap: false + an intersecting bar, select should now
    // reject. This REPLACES the Phase-19-era parking-gap assertion.
    const existingBar = bar('m', 'r1', 10, 12);
    const result = validateSelect(proposal('r1', 11, 13), {
      bars: [existingBar],
      eventOverlap: false,
    });
    expect(result).toBe('overlap');
  });
});

describe('validateSelect — selectOverlap (Phase 55)', () => {
  const existingBar = bar('m', 'r1', 10, 12);

  it('selectOverlap: false vetoes a proposal that intersects an existing bar', () => {
    const result = validateSelect(proposal('r1', 11, 13), {
      bars: [existingBar],
      selectOverlap: false,
    });
    expect(result).toBe('overlap');
  });

  it('selectOverlap: false passes when proposal does not intersect any bar', () => {
    const result = validateSelect(proposal('r1', 14, 16), {
      bars: [existingBar],
      selectOverlap: false,
    });
    expect(result).toBeNull();
  });

  it('selectOverlap takes precedence over eventOverlap when both are set', () => {
    // selectOverlap: true overrides eventOverlap: false → select passes
    // even though drag-side policy is restrictive.
    expect(
      validateSelect(proposal('r1', 11, 13), {
        bars: [existingBar],
        selectOverlap: true,
        eventOverlap: false,
      }),
    ).toBeNull();
    // selectOverlap: false overrides eventOverlap: true → select rejects
    // even though drag-side policy is permissive.
    expect(
      validateSelect(proposal('r1', 11, 13), {
        bars: [existingBar],
        selectOverlap: false,
        eventOverlap: true,
      }),
    ).toBe('overlap');
  });

  it('selectOverlap function-form receives the intersecting bar with null second arg', () => {
    const overlapFunc = vi.fn().mockReturnValue(false);
    const result = validateSelect(proposal('r1', 11, 13), {
      bars: [existingBar],
      selectOverlap: overlapFunc,
    });
    expect(result).toBe('overlap');
    expect(overlapFunc).toHaveBeenCalledTimes(1);
    expect(overlapFunc.mock.calls[0]?.[0]).toMatchObject({ id: 'm' });
    expect(overlapFunc.mock.calls[0]?.[1]).toBeNull();
  });
});

describe('validateSelect — selectConstraint (Phase 55)', () => {
  const tightWindow: EventConstraint = {
    range: {
      start: new Date(todayMs + 8 * MS_PER_HOUR),
      end: new Date(todayMs + 12 * MS_PER_HOUR),
    },
  };
  const wideWindow: EventConstraint = {
    range: {
      start: new Date(todayMs + 0 * MS_PER_HOUR),
      end: new Date(todayMs + 24 * MS_PER_HOUR),
    },
  };

  it('selectConstraint vetoes a proposal outside its window', () => {
    expect(
      validateSelect(proposal('r1', 14, 16), {
        bars: [],
        selectConstraint: tightWindow,
      }),
    ).toBe('constraint');
  });

  it('selectConstraint takes precedence over eventConstraint when both are set', () => {
    // tight selectConstraint + wide eventConstraint: select narrows.
    expect(
      validateSelect(proposal('r1', 14, 16), {
        bars: [],
        selectConstraint: tightWindow,
        eventConstraint: wideWindow,
      }),
    ).toBe('constraint');
    // wide selectConstraint + tight eventConstraint: select widens.
    expect(
      validateSelect(proposal('r1', 14, 16), {
        bars: [],
        selectConstraint: wideWindow,
        eventConstraint: tightWindow,
      }),
    ).toBeNull();
  });
});
