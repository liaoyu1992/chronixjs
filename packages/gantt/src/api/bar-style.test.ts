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
  };
}

describe('resolveBarStyle — theme default cascade', () => {
  it('returns the theme defaults when no overrides are configured', () => {
    const result = resolveBarStyle(baseInput(bar('b1')));
    expect(result).toEqual({
      backgroundColor: '#3b82f6',
      borderColor: '#1e40af',
      textColor: '#ffffff',
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
