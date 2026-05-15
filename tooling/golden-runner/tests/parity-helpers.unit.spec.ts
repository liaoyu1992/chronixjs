/**
 * **Phase 20.5: unit tests for the pure parity-helper functions.**
 *
 * The `extract*Snapshot` helpers require a real Playwright Locator
 * (live browser DOM) and are exercised by the integration parity
 * tests in `parity.spec.ts` and `chronix-visual.spec.ts`. These
 * unit tests cover the PURE functions (`hexToRgbString`,
 * `diffSnapshots`, `formatSnapshotDiff`, `diffBarsSnapshots`
 * legacy adapter) — no `page` fixture needed.
 *
 * Run via `pnpm --filter @chronixjs/golden-runner verify` (these
 * register as Playwright tests but skip the `page` fixture; they
 * pass / fail purely on pure-function output).
 */
import { expect, test } from '@playwright/test';

import {
  diffBarsSnapshots,
  diffSnapshots,
  formatSnapshotDiff,
  hexToRgbString,
  type DomBarSnapshot,
  type DomElementSnapshot,
} from '../src/parity-helpers.js';

test.describe('hexToRgbString', () => {
  test('round-trips standard 6-char hex strings', () => {
    expect(hexToRgbString('#3788d8')).toBe('rgb(55, 136, 216)');
    expect(hexToRgbString('#ffffff')).toBe('rgb(255, 255, 255)');
    expect(hexToRgbString('#000000')).toBe('rgb(0, 0, 0)');
    expect(hexToRgbString('#3b82f6')).toBe('rgb(59, 130, 246)');
  });

  test('accepts upper-case hex input', () => {
    expect(hexToRgbString('#3788D8')).toBe('rgb(55, 136, 216)');
  });

  test('returns null for unparseable inputs', () => {
    expect(hexToRgbString('#fff')).toBeNull(); // 3-char not supported in v0
    expect(hexToRgbString('rgb(55, 136, 216)')).toBeNull();
    expect(hexToRgbString('')).toBeNull();
    expect(hexToRgbString('#zzzzzz')).toBeNull();
  });
});

test.describe('diffSnapshots — generic per-channel diff', () => {
  function elem(id: string, overrides: Partial<DomElementSnapshot> = {}): DomElementSnapshot {
    return {
      id,
      x: 0,
      y: 0,
      width: 100,
      height: 30,
      ...overrides,
    };
  }

  test('pairs by id; identical pairs produce no mismatches', () => {
    const a = [elem('e1'), elem('e2')];
    const b = [elem('e1'), elem('e2')];
    const diff = diffSnapshots(a, b);
    expect(diff.mismatches).toEqual([]);
    expect(diff.onlyInKui).toEqual([]);
    expect(diff.onlyInChronix).toEqual([]);
  });

  test('numeric channels: delta within tolerance passes; beyond tolerance mismatches', () => {
    const a = [elem('e1', { x: 100 })];
    const b = [elem('e1', { x: 100.5 })];
    expect(diffSnapshots(a, b).mismatches).toEqual([]); // default tolerance = 1px

    const c = [elem('e1', { x: 102 })];
    const diff = diffSnapshots(a, c);
    expect(diff.mismatches).toHaveLength(1);
    expect(diff.mismatches[0]!.field).toBe('x');
    expect(diff.mismatches[0]!.delta).toBe(2);
  });

  test('Infinity tolerance skips the channel entirely', () => {
    const a = [elem('e1', { y: 50 })];
    const b = [elem('e1', { y: 9999 })];
    const diff = diffSnapshots(a, b, { y: Number.POSITIVE_INFINITY });
    expect(diff.mismatches.filter((m) => m.field === 'y')).toEqual([]);
  });

  test('text channel: default exact equality; mismatches when different', () => {
    const a = [elem('e1', { text: '5月13日' })];
    const b = [elem('e1', { text: '5月14日' })];
    const diff = diffSnapshots(a, b);
    expect(diff.mismatches).toHaveLength(1);
    expect(diff.mismatches[0]!.field).toBe('text');
  });

  test('text tolerance "skip" bypasses the check', () => {
    const a = [elem('e1', { text: '5月13日' })];
    const b = [elem('e1', { text: '5月14日' })];
    expect(diffSnapshots(a, b, { text: 'skip' }).mismatches).toEqual([]);
  });

  test('style channel: exact equality on color strings; mismatches when different', () => {
    const a = [elem('e1', { style: { fill: 'rgb(55, 136, 216)' } })];
    const b = [elem('e1', { style: { fill: 'rgb(255, 0, 0)' } })];
    const diff = diffSnapshots(a, b);
    expect(diff.mismatches).toHaveLength(1);
    expect(diff.mismatches[0]!.field).toBe('style.fill');
  });

  test('style tolerance "skip" per-key bypasses that key only', () => {
    const a = [elem('e1', { style: { fill: 'rgb(55, 136, 216)', stroke: 'rgb(0, 0, 0)' } })];
    const b = [elem('e1', { style: { fill: 'rgb(255, 0, 0)', stroke: 'rgb(0, 0, 0)' } })];
    const diff = diffSnapshots(a, b, { style: { fill: 'skip' } });
    expect(diff.mismatches).toEqual([]);
  });

  test('style numeric tolerance: fontSize within ±N parses + compares numerically', () => {
    const a = [elem('e1', { style: { fontSize: '12px' } })];
    const b = [elem('e1', { style: { fontSize: '13px' } })];
    expect(diffSnapshots(a, b, { style: { fontSize: 2 } }).mismatches).toEqual([]);
    expect(diffSnapshots(a, b, { style: { fontSize: 0.5 } }).mismatches).toHaveLength(1);
  });

  test('only-in-kui / only-in-chronix lists are populated separately from mismatches', () => {
    const a = [elem('only-kui'), elem('both')];
    const b = [elem('only-chronix'), elem('both')];
    const diff = diffSnapshots(a, b);
    expect(diff.mismatches).toEqual([]);
    expect(diff.onlyInKui).toEqual(['only-kui']);
    expect(diff.onlyInChronix).toEqual(['only-chronix']);
  });

  test('style key present on only one side counts as a mismatch (exact default)', () => {
    const a = [elem('e1', { style: { fill: 'rgb(55, 136, 216)' } })];
    const b = [elem('e1', { style: {} })];
    const diff = diffSnapshots(a, b);
    expect(diff.mismatches.some((m) => m.field === 'style.fill')).toBe(true);
  });
});

test.describe('diffBarsSnapshots — legacy adapter preserves pre-Phase-20.5 behavior', () => {
  function bar(id: string, overrides: Partial<DomBarSnapshot> = {}): DomBarSnapshot {
    return {
      id,
      x: 0,
      y: 0,
      width: 100,
      height: 30,
      fill: 'rgb(59, 130, 246)',
      ...overrides,
    };
  }

  test('legacy DomBarSnapshot inputs still pair + diff per channel', () => {
    const kui = [bar('event-1', { x: 100 }), bar('event-2', { x: 200 })];
    const chronix = [bar('event-1', { x: 100.5 }), bar('event-2', { x: 200 })];
    const diff = diffBarsSnapshots(kui, chronix);
    expect(diff.mismatches).toEqual([]);
    expect(diff.onlyInKui).toEqual([]);
    expect(diff.onlyInChronix).toEqual([]);
  });

  test('legacy ParityTolerance shape continues to gate channels', () => {
    const kui = [bar('event-1', { y: 50 })];
    const chronix = [bar('event-1', { y: 100 })];
    const diff = diffBarsSnapshots(kui, chronix, { y: Number.POSITIVE_INFINITY });
    expect(diff.mismatches).toEqual([]);
  });
});

test.describe('formatSnapshotDiff', () => {
  test('returns "parity OK" when no mismatches', () => {
    expect(formatSnapshotDiff({ mismatches: [], onlyInKui: [], onlyInChronix: [] })).toBe(
      'parity OK (no mismatches)',
    );
  });

  test('formats per-id grouped mismatches with delta annotation', () => {
    const out = formatSnapshotDiff({
      mismatches: [
        { id: 'e1', field: 'x', kuiValue: 100, chronixValue: 105, delta: 5 },
        { id: 'e1', field: 'style.fill', kuiValue: 'rgb(0,0,0)', chronixValue: 'rgb(255,0,0)' },
      ],
      onlyInKui: ['only-k'],
      onlyInChronix: ['only-c'],
    });
    expect(out).toContain('e1:');
    expect(out).toContain('x: kui=100 chronix=105');
    expect(out).toContain('Δ=5.00');
    expect(out).toContain('style.fill');
    expect(out).toContain('only-k');
    expect(out).toContain('only-c');
  });
});
