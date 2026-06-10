import { beforeEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import { bool, describeConfigSchema, enumOf, num, str, useDemoConfig } from './demo-config.js';

/**
 * Phase 46: port of vue3's `examples/gantt-vue3/src/demo-config.test.ts`.
 * Vue 2.7's Composition API has the same `ref` / `watch` / `nextTick`
 * primitives as Vue 3 — the tests are identical.
 *
 * happy-dom provides a mutable `window.location.href` setter, so the
 * test harness can drive `useDemoConfig` from arbitrary search strings
 * without a real browser navigation.
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
    const cfg = useDemoConfig({
      editable: bool(true),
      selectable: bool(true),
      snap: num(0),
    });
    expect(cfg.editable.value).toBe(false);
    expect(cfg.selectable.value).toBe(true);
    expect(cfg.snap.value).toBe(30);
  });

  it('writes back to URL when a ref changes; default values strip the key', async () => {
    const cfg = useDemoConfig({
      editable: bool(true),
    });
    cfg.editable.value = false;
    await nextTick();
    expect(window.location.search).toBe('?editable=false');

    cfg.editable.value = true;
    await nextTick();
    expect(window.location.search).toBe('');
  });

  it('resetAll restores defaults and clears the URL query', async () => {
    setUrl('?editable=false&selectable=false');
    const cfg = useDemoConfig({
      editable: bool(true),
      selectable: bool(true),
    });
    expect(cfg.editable.value).toBe(false);

    cfg.resetAll();
    await nextTick();
    expect(cfg.editable.value).toBe(true);
    expect(cfg.selectable.value).toBe(true);
    expect(window.location.search).toBe('');
  });

  it('preserves unrelated URL params when writing a single key', async () => {
    setUrl('?other=keep');
    const cfg = useDemoConfig({
      editable: bool(true),
    });
    cfg.editable.value = false;
    await nextTick();
    const params = new URLSearchParams(window.location.search);
    expect(params.get('other')).toBe('keep');
    expect(params.get('editable')).toBe('false');
  });

  it('exposes schema for introspection (URL-doc panel)', () => {
    const schema = {
      editable: bool(true, 'Enable drag + resize'),
      view: enumOf(['day', 'week'] as const, 'day', 'Initial view'),
    };
    const cfg = useDemoConfig(schema);
    expect(cfg.schema).toBe(schema);
    const docs = describeConfigSchema(schema);
    expect(docs).toHaveLength(2);
    expect(docs[0]).toMatchObject({
      key: 'editable',
      defaultValue: 'true',
      description: 'Enable drag + resize',
    });
  });

  it('Phase 21: todayLine bool schema field round-trips through URL', async () => {
    setUrl('?todayLine=true');
    const cfg = useDemoConfig({
      todayLine: bool(false, 'Show today-line'),
    });
    expect(cfg.todayLine.value).toBe(true);

    cfg.todayLine.value = false;
    await nextTick();
    expect(new URLSearchParams(window.location.search).has('todayLine')).toBe(false);

    cfg.todayLine.value = true;
    await nextTick();
    expect(new URLSearchParams(window.location.search).get('todayLine')).toBe('true');
  });
});
