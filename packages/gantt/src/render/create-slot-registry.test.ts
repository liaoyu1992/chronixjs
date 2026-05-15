import { describe, expect, it, vi } from 'vitest';

import { createSlotRegistry } from './create-slot-registry.js';

import type { SlotTemplate } from './slot.js';

// Stub templates returning string sentinels — `SlotTemplate` returns
// `unknown` because core is framework-agnostic; in tests we just need
// something the registry can hand back unchanged.
const tmpl = (label: string): SlotTemplate => {
  const fn: SlotTemplate = () => label;
  return fn;
};

describe('createSlotRegistry', () => {
  it('returns an empty registry by default (has() and get() are both false / undefined)', () => {
    const registry = createSlotRegistry();
    expect(registry.has('bar')).toBe(false);
    expect(registry.get('bar')).toBeUndefined();
  });

  it('register() then get() returns the same template instance back', () => {
    const registry = createSlotRegistry();
    const barTemplate = tmpl('bar-A');
    registry.register('bar', barTemplate);
    expect(registry.has('bar')).toBe(true);
    expect(registry.get('bar')).toBe(barTemplate);
  });

  it('unregister() removes the slot — has() becomes false', () => {
    const registry = createSlotRegistry();
    registry.register('bar', tmpl('bar-A'));
    expect(registry.has('bar')).toBe(true);
    registry.unregister('bar');
    expect(registry.has('bar')).toBe(false);
    expect(registry.get('bar')).toBeUndefined();
  });

  it('register() on an existing slot replaces the template (no merge / no stacking)', () => {
    const registry = createSlotRegistry();
    const first = tmpl('first');
    const second = tmpl('second');
    registry.register('bar', first);
    registry.register('bar', second);
    // Replaced, not stacked.
    expect(registry.get('bar')).toBe(second);
    expect(registry.get('bar')).not.toBe(first);
    // Sanity: calling the resolved template yields the second sentinel.
    const resolved = registry.get('bar');
    expect(resolved?.({ slot: 'bar', args: {} })).toBe('second');
  });

  it('unregister() on a never-registered slot is a safe no-op', () => {
    const registry = createSlotRegistry();
    expect(() => registry.unregister('never-existed')).not.toThrow();
    expect(registry.has('never-existed')).toBe(false);
    // Sibling slots stay untouched.
    registry.register('bar', tmpl('bar-A'));
    registry.unregister('never-existed');
    expect(registry.has('bar')).toBe(true);
  });

  it('multiple distinct slots coexist independently', () => {
    const registry = createSlotRegistry();
    const barT = tmpl('bar');
    const headerT = tmpl('header');
    registry.register('bar', barT);
    registry.register('header-cell', headerT);
    expect(registry.get('bar')).toBe(barT);
    expect(registry.get('header-cell')).toBe(headerT);
    // Unregistering one doesn't disturb the other.
    registry.unregister('bar');
    expect(registry.has('bar')).toBe(false);
    expect(registry.has('header-cell')).toBe(true);
  });

  it('template return type is opaque — registry passes the value through verbatim', () => {
    // SlotTemplate returns `unknown`; the registry doesn't inspect it.
    const sentinel = { kind: 'svg-vnode', tag: 'rect' };
    const registry = createSlotRegistry();
    const wrapper: SlotTemplate = vi.fn(() => sentinel);
    registry.register('bar', wrapper);
    const resolved = registry.get('bar');
    expect(resolved?.({ slot: 'bar', args: { foo: 1 } })).toBe(sentinel);
    expect(vi.mocked(wrapper)).toHaveBeenCalledOnce();
    expect(vi.mocked(wrapper).mock.calls[0]![0]).toEqual({ slot: 'bar', args: { foo: 1 } });
  });
});
