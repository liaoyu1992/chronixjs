import { describe, expect, it, vi } from 'vitest';

import { resolveBarStyle, type BarStyleArg, type ResolveBarStyleInput } from './bar-style.js';

import type { BarSpec } from '../ir/index.js';
import type { PlacedBar } from '../layout/types.js';

const MS_PER_HOUR = 60 * 60 * 1000;
const todayMs = new Date('2026-05-13T00:00:00').setHours(0, 0, 0, 0);

function bar(id: string, opts: Partial<Pick<BarSpec, 'style' | 'extendedProps'>> = {}): BarSpec {
  return {
    id,
    rowId: 'r1',
    range: { start: new Date(todayMs), end: new Date(todayMs + 4 * MS_PER_HOUR) },
    dprIntent: 'crisp-pixel',
    ...opts,
  };
}

function placed(id: string): PlacedBar {
  return { barId: id, x: 0, y: 0, width: 240, height: 30, isStart: true, isEnd: true };
}

/**
 * Common base for the resolver's inputs. Theme defaults match the
 * `defaultChronixTheme` literals so tests assert against the same
 * cascade floor the adapter ships with.
 */
function baseInput(barSpec: BarSpec): ResolveBarStyleInput {
  return {
    bar: barSpec,
    placedBar: placed(barSpec.id),
    isSelected: false,
    activeTransaction: null,
    themeBackgroundColor: '#3b82f6',
    themeBorderColor: '#1e40af',
    themeTextColor: '#ffffff',
    // font cascade defaults match `defaultChronixTheme`.
    themeFontSize: 12,
    themeFontWeight: 400,
  };
}

describe('resolveBarStyle — theme default cascade', () => {
  it('returns the theme defaults when no overrides are configured', () => {
    const result = resolveBarStyle(baseInput(bar('b1')));
    expect(result).toEqual({
      backgroundColor: '#3b82f6',
      borderColor: '#1e40af',
      textColor: '#ffffff',
      fontSize: 12,
      fontWeight: 400,
      // no callback → empty class-names array.
      classNames: [],
    });
  });
});

describe('resolveBarStyle — `barColor` umbrella prop', () => {
  it('sets both background and border when only `barColor` is set', () => {
    const result = resolveBarStyle({ ...baseInput(bar('b1')), barColor: '#8b5cf6' });
    expect(result.backgroundColor).toBe('#8b5cf6');
    expect(result.borderColor).toBe('#8b5cf6');
    // Text color is unaffected by `barColor`.
    expect(result.textColor).toBe('#ffffff');
  });

  it('specific `barBackgroundColor` wins over `barColor` umbrella for background', () => {
    const result = resolveBarStyle({
      ...baseInput(bar('b1')),
      barColor: '#8b5cf6',
      barBackgroundColor: '#10b981',
    });
    expect(result.backgroundColor).toBe('#10b981');
    // Border still inherits from `barColor`.
    expect(result.borderColor).toBe('#8b5cf6');
  });
});

describe('resolveBarStyle — `BarSpec.style` per-bar overrides', () => {
  it('per-bar style overrides the component-prop layer', () => {
    const styledBar = bar('b1', { style: { backgroundColor: '#ef4444' } });
    const result = resolveBarStyle({
      ...baseInput(styledBar),
      barBackgroundColor: '#10b981',
    });
    expect(result.backgroundColor).toBe('#ef4444');
  });

  it('omitted spec.style fields fall through to the component-prop layer', () => {
    const styledBar = bar('b1', { style: { textColor: '#000000' } });
    const result = resolveBarStyle({
      ...baseInput(styledBar),
      barBackgroundColor: '#10b981',
    });
    // textColor came from spec.style.
    expect(result.textColor).toBe('#000000');
    // backgroundColor came from the component prop.
    expect(result.backgroundColor).toBe('#10b981');
  });
});

describe('resolveBarStyle — callbacks', () => {
  it('background callback overrides spec.style.backgroundColor', () => {
    const styledBar = bar('b1', { style: { backgroundColor: '#ef4444' } });
    const result = resolveBarStyle({
      ...baseInput(styledBar),
      barBackgroundColorCallback: () => '#f59e0b',
    });
    expect(result.backgroundColor).toBe('#f59e0b');
  });

  it('callback returning `undefined` defers to the cascaded default', () => {
    const styledBar = bar('b1', { style: { backgroundColor: '#ef4444' } });
    const result = resolveBarStyle({
      ...baseInput(styledBar),
      barBackgroundColorCallback: () => undefined,
    });
    expect(result.backgroundColor).toBe('#ef4444');
  });

  it('passes `arg.defaultBackgroundColor` reflecting the cascade so far', () => {
    const callback = vi.fn<(arg: BarStyleArg) => string | undefined>(() => '#new');
    const styledBar = bar('b1', { style: { backgroundColor: '#cascaded' } });
    resolveBarStyle({
      ...baseInput(styledBar),
      barBackgroundColor: '#prop',
      barBackgroundColorCallback: callback,
    });
    expect(callback).toHaveBeenCalledTimes(1);
    const arg = callback.mock.calls[0]?.[0];
    expect(arg?.defaultBackgroundColor).toBe('#cascaded');
  });

  it('forwards `isSelected` + `activeTransaction` to the callback arg', () => {
    const callback = vi.fn<(arg: BarStyleArg) => string | undefined>(() => undefined);
    resolveBarStyle({
      ...baseInput(bar('b1')),
      isSelected: true,
      barTextColorCallback: callback,
    });
    const arg = callback.mock.calls[0]?.[0];
    expect(arg?.isSelected).toBe(true);
    expect(arg?.activeTransaction).toBeNull();
  });
});

describe('resolveBarStyle — background-overrides-border umbrella', () => {
  it('fires when background is overridden but border stays at theme', () => {
    const result = resolveBarStyle({
      ...baseInput(bar('b1')),
      barBackgroundColor: '#10b981',
    });
    expect(result.backgroundColor).toBe('#10b981');
    expect(result.borderColor).toBe('#10b981');
  });

  it('does NOT fire when both background and border come from the theme', () => {
    const result = resolveBarStyle(baseInput(bar('b1')));
    expect(result.backgroundColor).toBe('#3b82f6');
    expect(result.borderColor).toBe('#1e40af');
  });

  it('does NOT fire when border is also overridden via prop', () => {
    const result = resolveBarStyle({
      ...baseInput(bar('b1')),
      barBackgroundColor: '#10b981',
      barBorderColor: '#000000',
    });
    expect(result.backgroundColor).toBe('#10b981');
    expect(result.borderColor).toBe('#000000');
  });

  it('fires when callback overrides background but border stays at theme', () => {
    const result = resolveBarStyle({
      ...baseInput(bar('b1')),
      barBackgroundColorCallback: () => '#f59e0b',
    });
    expect(result.backgroundColor).toBe('#f59e0b');
    expect(result.borderColor).toBe('#f59e0b');
  });
});

describe('resolveBarStyle — full cascade precedence', () => {
  it('callback > spec.style > component prop > theme (background)', () => {
    const styledBar = bar('b1', { style: { backgroundColor: '#spec' } });
    const result = resolveBarStyle({
      ...baseInput(styledBar),
      barBackgroundColor: '#prop',
      barBackgroundColorCallback: () => '#callback',
    });
    expect(result.backgroundColor).toBe('#callback');
  });
});

describe('resolveBarStyle.2 font cascade', () => {
  it('returns themeFontSize / themeFontWeight when no font callback is set', () => {
    const result = resolveBarStyle(baseInput(bar('b1')));
    expect(result.fontSize).toBe(12);
    expect(result.fontWeight).toBe(400);
  });

  it('barFontSizeCallback returning a number overrides the theme default', () => {
    const result = resolveBarStyle({
      ...baseInput(bar('b1')),
      barFontSizeCallback: () => 16,
    });
    expect(result.fontSize).toBe(16);
  });

  it('barFontWeightCallback returning a number overrides the theme default', () => {
    const result = resolveBarStyle({
      ...baseInput(bar('b1')),
      barFontWeightCallback: () => 700,
    });
    expect(result.fontWeight).toBe(700);
  });

  it('barFontWeightCallback returning a CSS keyword string is passed through verbatim', () => {
    const result = resolveBarStyle({
      ...baseInput(bar('b1')),
      barFontWeightCallback: () => 'bold',
    });
    expect(result.fontWeight).toBe('bold');
  });

  it('callback returning `undefined` falls through to the theme default', () => {
    const result = resolveBarStyle({
      ...baseInput(bar('b1')),
      barFontSizeCallback: () => undefined,
      barFontWeightCallback: () => undefined,
    });
    expect(result.fontSize).toBe(12);
    expect(result.fontWeight).toBe(400);
  });

  it('BarStyleArg passed to font callbacks carries `defaultFontSize` / `defaultFontWeight` from the theme', () => {
    let receivedSize: number | undefined;
    let receivedWeight: number | string | undefined;
    resolveBarStyle({
      ...baseInput(bar('b1')),
      barFontSizeCallback: (arg) => {
        receivedSize = arg.defaultFontSize;
        return undefined;
      },
      barFontWeightCallback: (arg) => {
        receivedWeight = arg.defaultFontWeight;
        return undefined;
      },
    });
    expect(receivedSize).toBe(12);
    expect(receivedWeight).toBe(400);
  });

  it('font callbacks coexist with color callbacks without interference', () => {
    const result = resolveBarStyle({
      ...baseInput(bar('b1')),
      barBackgroundColorCallback: () => '#color',
      barFontSizeCallback: () => 14,
      barFontWeightCallback: () => 600,
    });
    expect(result.backgroundColor).toBe('#color');
    expect(result.fontSize).toBe(14);
    expect(result.fontWeight).toBe(600);
  });
});

describe('resolveBarStyle.3 `barClassNamesCallback`', () => {
  it('returns an empty `classNames` array when no class callback is set', () => {
    const result = resolveBarStyle(baseInput(bar('b1')));
    expect(result.classNames).toEqual([]);
  });

  it('normalizes a string return into a single-entry array', () => {
    const result = resolveBarStyle({
      ...baseInput(bar('b1')),
      barClassNamesCallback: () => 'priority-high',
    });
    expect(result.classNames).toEqual(['priority-high']);
  });

  it('passes a returned array through verbatim (order + duplicates preserved)', () => {
    const result = resolveBarStyle({
      ...baseInput(bar('b1')),
      barClassNamesCallback: () => ['warn', 'overdue', 'warn'],
    });
    expect(result.classNames).toEqual(['warn', 'overdue', 'warn']);
  });

  it('callback returning `undefined` leaves `classNames` as the empty default', () => {
    const result = resolveBarStyle({
      ...baseInput(bar('b1')),
      barClassNamesCallback: () => undefined,
    });
    expect(result.classNames).toEqual([]);
  });

  it('class callback receives the same `BarStyleArg` shape color + font callbacks see', () => {
    const seen = vi.fn((_arg: BarStyleArg): string => 'x');
    resolveBarStyle({
      ...baseInput(bar('b1')),
      barColor: '#10b981',
      barClassNamesCallback: seen,
    });
    const arg = seen.mock.calls[0]![0];
    expect(arg.bar.id).toBe('b1');
    expect(arg.placedBar.barId).toBe('b1');
    expect(arg.isSelected).toBe(false);
    expect(arg.activeTransaction).toBeNull();
    // The arg carries the cascaded color / font defaults (post layers
    // 1-3). When `barColor` is set, both background and border defaults
    // reflect the prop layer.
    expect(arg.defaultBackgroundColor).toBe('#10b981');
    expect(arg.defaultBorderColor).toBe('#10b981');
    expect(arg.defaultTextColor).toBe('#ffffff');
    expect(arg.defaultFontSize).toBe(12);
    expect(arg.defaultFontWeight).toBe(400);
  });

  it('class callback fires in the same cascade slot as color + font callbacks (all coexist)', () => {
    const result = resolveBarStyle({
      ...baseInput(bar('b1')),
      barBackgroundColorCallback: () => '#bg',
      barTextColorCallback: () => '#fg',
      barFontSizeCallback: () => 14,
      barClassNamesCallback: () => ['priority-high'],
    });
    // All 4 channels resolve in one pass.
    expect(result.backgroundColor).toBe('#bg');
    expect(result.textColor).toBe('#fg');
    expect(result.fontSize).toBe(14);
    expect(result.classNames).toEqual(['priority-high']);
  });
});
