import { describe, expect, it } from 'vitest';

import { resolveDiscreteDialogClassList } from './resolve-discrete-dialog-class-list.js';

import type { DialogType } from './discrete-dialog-spec.js';

describe('resolveDiscreteDialogClassList', () => {
  it('returns base + default type for default', () => {
    expect(resolveDiscreteDialogClassList({ type: 'default' })).toEqual([
      'cx-ui-dialog',
      'cx-ui-dialog--default',
    ]);
  });

  it('reflects all 5 types', () => {
    const types: DialogType[] = ['info', 'success', 'warning', 'error', 'default'];
    for (const t of types) {
      const classes = resolveDiscreteDialogClassList({ type: t });
      expect(classes).toContain('cx-ui-dialog');
      expect(classes).toContain(`cx-ui-dialog--${t}`);
    }
  });

  it('always returns exactly 2 classes', () => {
    const types: DialogType[] = ['info', 'success', 'warning', 'error', 'default'];
    for (const t of types) {
      expect(resolveDiscreteDialogClassList({ type: t })).toHaveLength(2);
    }
  });
});
