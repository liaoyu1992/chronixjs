import { describe, expect, it } from 'vitest';

import type { DialogItem, DialogType } from './discrete-dialog-spec.js';

describe('DialogItem type', () => {
  it('accepts a valid dialog item with all fields', () => {
    const item: DialogItem = {
      id: 'dlg-0',
      title: 'Confirm delete',
      content: 'Are you sure you want to delete this item?',
      type: 'warning',
      positiveText: 'Delete',
      negativeText: 'Cancel',
      closable: true,
    };
    expect(item.id).toBe('dlg-0');
    expect(item.title).toBe('Confirm delete');
    expect(item.content).toBe('Are you sure you want to delete this item?');
    expect(item.type).toBe('warning');
    expect(item.positiveText).toBe('Delete');
    expect(item.negativeText).toBe('Cancel');
    expect(item.closable).toBe(true);
  });

  it('accepts a minimal dialog (content-only)', () => {
    const item: DialogItem = {
      id: 'dlg-1',
      content: 'Operation complete.',
      type: 'default',
      closable: false,
    };
    expect(item.title).toBeUndefined();
    expect(item.positiveText).toBeUndefined();
    expect(item.negativeText).toBeUndefined();
  });
});

describe('DialogType type', () => {
  it('covers all 5 semantic types', () => {
    const types: DialogType[] = ['info', 'success', 'warning', 'error', 'default'];
    expect(types).toHaveLength(5);
  });
});
