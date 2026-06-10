import { describe, expect, it } from 'vitest';

import { DEFAULT_ICONS, DEFAULT_ICON_VIEW_BOX } from './default-icons.js';
import { getIcon, hasIcon, listIconNames, registerIcon } from './icon-registry.js';

import type { IconSpec } from './icon-spec.js';

let testIconCounter = 0;
function nextTestIconName(): string {
  testIconCounter += 1;
  return `test-icon-${testIconCounter}`;
}

function buildTestIcon(name: string): IconSpec {
  return {
    name,
    viewBox: '0 0 16 16',
    paths: [{ d: 'M0 0 L16 0 L16 16 L0 16 Z' }],
  };
}

describe('iconRegistry — pre-registered defaults', () => {
  it('all 12 default icons are accessible by name', () => {
    for (const icon of DEFAULT_ICONS) {
      expect(getIcon(icon.name), icon.name).toBe(icon);
      expect(hasIcon(icon.name)).toBe(true);
    }
  });

  it('chevron-down resolves to the expected default spec', () => {
    const icon = getIcon('chevron-down');
    expect(icon).toBeDefined();
    expect(icon!.viewBox).toBe(DEFAULT_ICON_VIEW_BOX);
    expect(icon!.paths).toHaveLength(1);
  });

  it('listIconNames includes all 12 defaults', () => {
    const names = listIconNames();
    for (const icon of DEFAULT_ICONS) {
      expect(names).toContain(icon.name);
    }
  });

  it('listIconNames returns sorted output', () => {
    const names = listIconNames();
    for (let i = 1; i < names.length; i++) {
      expect(names[i - 1]!.localeCompare(names[i]!)).toBeLessThanOrEqual(0);
    }
  });
});

describe('iconRegistry — custom registration', () => {
  it('registerIcon adds a new icon and returns the spec', () => {
    const name = nextTestIconName();
    const spec = buildTestIcon(name);
    expect(registerIcon(spec)).toBe(spec);
    expect(hasIcon(name)).toBe(true);
    expect(getIcon(name)).toBe(spec);
  });

  it('getIcon returns undefined for unknown names', () => {
    expect(getIcon('non-existent-icon')).toBeUndefined();
    expect(hasIcon('non-existent-icon')).toBe(false);
  });

  it('re-registering replaces (latest wins)', () => {
    const name = nextTestIconName();
    const first = buildTestIcon(name);
    const second: IconSpec = { ...first, viewBox: '0 0 32 32' };
    registerIcon(first);
    registerIcon(second);
    expect(getIcon(name)).toBe(second);
    expect(getIcon(name)!.viewBox).toBe('0 0 32 32');
  });

  it('overriding a default icon (e.g. close) is allowed', () => {
    const customClose: IconSpec = {
      name: 'close',
      viewBox: '0 0 24 24',
      paths: [{ d: 'M2 2 L22 22 M22 2 L2 22' }],
    };
    const original = getIcon('close');
    registerIcon(customClose);
    expect(getIcon('close')).toBe(customClose);
    // Restore the original so other tests aren't affected.
    if (original) registerIcon(original);
    expect(getIcon('close')).toBe(original);
  });

  it('registry returns the same reference on repeated lookups', () => {
    const name = nextTestIconName();
    const spec = buildTestIcon(name);
    registerIcon(spec);
    expect(getIcon(name)).toBe(getIcon(name));
  });

  it('listIconNames includes custom registrations', () => {
    const name = nextTestIconName();
    registerIcon(buildTestIcon(name));
    expect(listIconNames()).toContain(name);
  });

  it('listIconNames returns a fresh array on each call', () => {
    const a = listIconNames();
    const b = listIconNames();
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });
});
