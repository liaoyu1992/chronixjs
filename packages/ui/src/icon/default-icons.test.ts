import { describe, expect, it } from 'vitest';

import { DEFAULT_ICONS, DEFAULT_ICON_VIEW_BOX } from './default-icons.js';

const EXPECTED_DEFAULT_NAMES = [
  'check',
  'chevron-down',
  'chevron-left',
  'chevron-right',
  'chevron-up',
  'close',
  'error',
  'info',
  'minus',
  'search',
  'success',
  'warning',
];

describe('DEFAULT_ICONS', () => {
  it('ships exactly 12 chronix-NEW default icons', () => {
    expect(DEFAULT_ICONS).toHaveLength(12);
  });

  it('exposes the expected icon names (Phase 9 baseline)', () => {
    expect(DEFAULT_ICONS.map((i) => i.name).sort()).toEqual(EXPECTED_DEFAULT_NAMES);
  });

  it('all defaults use the standard 24×24 viewBox', () => {
    expect(DEFAULT_ICON_VIEW_BOX).toBe('0 0 24 24');
    for (const icon of DEFAULT_ICONS) {
      expect(icon.viewBox, icon.name).toBe(DEFAULT_ICON_VIEW_BOX);
    }
  });

  it('every default icon has at least one path with a non-empty `d`', () => {
    for (const icon of DEFAULT_ICONS) {
      expect(icon.paths.length, `${icon.name}.paths`).toBeGreaterThanOrEqual(1);
      for (const p of icon.paths) {
        expect(typeof p.d).toBe('string');
        expect(p.d.length, `${icon.name}.d`).toBeGreaterThan(0);
      }
    }
  });

  it('compound icons (search + status) use evenodd fill rule for proper ring/donut subtraction', () => {
    const names = ['search', 'info', 'warning', 'error', 'success'];
    for (const name of names) {
      const icon = DEFAULT_ICONS.find((i) => i.name === name)!;
      expect(icon.paths[0]!.fillRule, `${name}.fillRule`).toBe('evenodd');
    }
  });

  it('simple icons (chevrons + close + check + minus) use default (no explicit) fill rule', () => {
    const names = [
      'chevron-down',
      'chevron-up',
      'chevron-left',
      'chevron-right',
      'close',
      'check',
      'minus',
    ];
    for (const name of names) {
      const icon = DEFAULT_ICONS.find((i) => i.name === name)!;
      expect(icon.paths[0]!.fillRule, `${name}.fillRule`).toBeUndefined();
    }
  });

  it('names use kebab-case (no spaces, no underscores, no capitals)', () => {
    for (const icon of DEFAULT_ICONS) {
      expect(icon.name, icon.name).toMatch(/^[a-z]+(-[a-z]+)*$/);
    }
  });
});
