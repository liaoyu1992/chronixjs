import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { bool, describeConfigSchema, enumOf, num, str, useDemoConfig } from './demo-config.js';

/**
 * React port of vue3's `demo-config.test.ts`. Field
 * factories (`bool` / `str` / `num` / `enumOf` / `describeConfigSchema`)
 * are framework-agnostic + tested as pure functions. The hook
 * (`useDemoConfig`) is tested via `@testing-library/react`'s
 * `renderHook` so React's `useState` + `useEffect` lifecycle runs
 * the same as in the demo, with happy-dom providing
 * `window.location` + `history.replaceState`.
 */
function setUrl(search: string): void {
  const url = new URL(window.location.origin);
  url.search = search;
  window.history.replaceState(null, '', url.toString());
}

beforeEach(() => {
  setUrl('');
});

describe('ConfigField factories', () => {
  it('bool parses true/false/missing correctly', () => {
    const f = bool(true);
    expect(f.parse(null)).toBe(true);
    expect(f.parse('true')).toBe(true);
    expect(f.parse('false')).toBe(false);
    expect(f.parse('anything-else')).toBe(false);
  });

  it('bool serialize returns null for default value, string otherwise', () => {
    const f = bool(true);
    expect(f.serialize(true)).toBeNull();
    expect(f.serialize(false)).toBe('false');
  });

  it('str respects default for missing, returns parsed for present', () => {
    const f = str<'red' | 'blue'>('red');
    expect(f.parse(null)).toBe('red');
    expect(f.parse('blue')).toBe('blue');
  });

  it('num falls back to default for unparseable input', () => {
    const f = num(10);
    expect(f.parse(null)).toBe(10);
    expect(f.parse('not-a-number')).toBe(10);
    expect(f.parse('20')).toBe(20);
    expect(f.parse('3.14')).toBe(3.14);
  });

  it('enumOf rejects out-of-set values, falls back to default', () => {
    const f = enumOf(['day', 'week', 'month'] as const, 'day');
    expect(f.parse(null)).toBe('day');
    expect(f.parse('week')).toBe('week');
    expect(f.parse('invalid')).toBe('day');
  });
});

describe('useDemoConfig', () => {
  it('initializes refs from URL query, falls back to defaults for missing keys', () => {
    setUrl('?editable=false&snap=30');
    const { result } = renderHook(() =>
      useDemoConfig({
        editable: bool(true),
        selectable: bool(true),
        snap: num(0),
      }),
    );
    expect(result.current.values.editable).toBe(false);
    expect(result.current.values.selectable).toBe(true);
    expect(result.current.values.snap).toBe(30);
  });

  it('writes back to URL when a setter fires; default values strip the key', () => {
    const { result } = renderHook(() =>
      useDemoConfig({
        editable: bool(true),
      }),
    );
    act(() => {
      result.current.setters.editable(false);
    });
    expect(window.location.search).toBe('?editable=false');

    act(() => {
      result.current.setters.editable(true);
    });
    expect(window.location.search).toBe('');
  });

  it('resetAll restores defaults and clears the URL query', () => {
    setUrl('?editable=false&selectable=false');
    const { result } = renderHook(() =>
      useDemoConfig({
        editable: bool(true),
        selectable: bool(true),
      }),
    );
    expect(result.current.values.editable).toBe(false);

    act(() => {
      result.current.resetAll();
    });
    expect(result.current.values.editable).toBe(true);
    expect(result.current.values.selectable).toBe(true);
    expect(window.location.search).toBe('');
  });

  it('preserves unrelated URL params when writing a single key', () => {
    setUrl('?other=keep');
    const { result } = renderHook(() =>
      useDemoConfig({
        editable: bool(true),
      }),
    );
    act(() => {
      result.current.setters.editable(false);
    });
    const params = new URLSearchParams(window.location.search);
    expect(params.get('other')).toBe('keep');
    expect(params.get('editable')).toBe('false');
  });

  it('exposes schema for introspection (URL-doc panel)', () => {
    const schema = {
      editable: bool(true, 'Enable drag + resize'),
      view: enumOf(['day', 'week'] as const, 'day', 'Initial view'),
    };
    const { result } = renderHook(() => useDemoConfig(schema));
    expect(result.current.schema).toBe(schema);
    const docs = describeConfigSchema(schema);
    expect(docs).toHaveLength(2);
    expect(docs[0]).toMatchObject({
      key: 'editable',
      defaultValue: 'true',
      description: 'Enable drag + resize',
    });
  });

  it('todayLine bool schema field round-trips through URL', () => {
    setUrl('?todayLine=true');
    const { result } = renderHook(() =>
      useDemoConfig({
        todayLine: bool(false, 'Show today-line'),
      }),
    );
    expect(result.current.values.todayLine).toBe(true);

    act(() => {
      result.current.setters.todayLine(false);
    });
    expect(new URLSearchParams(window.location.search).has('todayLine')).toBe(false);

    act(() => {
      result.current.setters.todayLine(true);
    });
    expect(new URLSearchParams(window.location.search).get('todayLine')).toBe('true');
  });
});
