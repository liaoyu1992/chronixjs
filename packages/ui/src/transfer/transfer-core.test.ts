// @vitest-environment happy-dom

/**
 * Transfer core tests — Phase 33 (2026-06-05).
 */

import { describe, expect, it } from 'vitest';

import {
  defaultTransferProps,
  computeTransferLists,
  filterTransferOptions,
  computeTransferBulkValue,
  resolveTransferRootClassList,
  resolveTransferItemClassList,
  resolveTransferPanelClassList,
  CHRONIX_TRANSFER_CSS,
  ensureChronixTransferStyles,
} from './index.js';

import type { TransferOption } from './index.js';

const OPTIONS: TransferOption[] = [
  { label: 'Apple', value: 'a' },
  { label: 'Banana', value: 'b' },
  { label: 'Cherry', value: 'c', disabled: true },
  { label: 'Date', value: 'd' },
];

describe('defaultTransferProps', () => {
  it('has correct defaults', () => {
    expect(defaultTransferProps.value).toEqual([]);
    expect(defaultTransferProps.options).toEqual([]);
    expect(defaultTransferProps.disabled).toBe(false);
    expect(defaultTransferProps.filterable).toBe(false);
    expect(defaultTransferProps.sourceTitle).toBe('Source');
    expect(defaultTransferProps.targetTitle).toBe('Target');
  });
});

describe('computeTransferLists', () => {
  it('splits options into source and target', () => {
    const { source, target } = computeTransferLists(OPTIONS, ['a', 'c']);
    expect(source.map((o) => o.value)).toEqual(['b', 'd']);
    expect(target.map((o) => o.value)).toEqual(['a', 'c']);
  });

  it('returns all as source when value is empty', () => {
    const { source, target } = computeTransferLists(OPTIONS, []);
    expect(source).toHaveLength(4);
    expect(target).toHaveLength(0);
  });

  it('returns all as target when value includes all', () => {
    const { source, target } = computeTransferLists(OPTIONS, ['a', 'b', 'c', 'd']);
    expect(source).toHaveLength(0);
    expect(target).toHaveLength(4);
  });

  it('preserves value order in target', () => {
    const { target } = computeTransferLists(OPTIONS, ['d', 'a']);
    expect(target.map((o) => o.value)).toEqual(['d', 'a']);
  });

  it('ignores values not in options', () => {
    const { source, target } = computeTransferLists(OPTIONS, ['a', 'z']);
    expect(source).toHaveLength(3);
    expect(target).toHaveLength(1);
    expect(target[0]!.value).toBe('a');
  });
});

describe('filterTransferOptions', () => {
  it('returns all options with empty pattern', () => {
    const result = filterTransferOptions(OPTIONS, '');
    expect(result).toHaveLength(4);
  });

  it('filters by case-insensitive substring', () => {
    const result = filterTransferOptions(OPTIONS, 'ap');
    expect(result).toHaveLength(1);
    expect(result[0]!.value).toBe('a');
  });

  it('returns empty for no match', () => {
    const result = filterTransferOptions(OPTIONS, 'xyz');
    expect(result).toHaveLength(0);
  });
});

describe('computeTransferBulkValue', () => {
  it('check-all adds non-disabled source options', () => {
    const result = computeTransferBulkValue('check-all', ['a'], OPTIONS);
    expect(result).toContain('a');
    expect(result).toContain('b');
    expect(result).toContain('d');
    // Cherry is disabled, should NOT be added on check-all
    expect(result).not.toContain('c');
  });

  it('uncheck-all removes non-disabled source options', () => {
    const result = computeTransferBulkValue('uncheck-all', ['a', 'b', 'c'], OPTIONS);
    // 'c' is disabled in options, so it should remain
    expect(result).toEqual(['c']);
  });

  it('clear removes all', () => {
    const result = computeTransferBulkValue('clear', ['a', 'b', 'c'], OPTIONS);
    expect(result).toEqual([]);
  });
});

describe('resolveTransferRootClassList', () => {
  it('returns base class', () => {
    expect(resolveTransferRootClassList({ disabled: false })).toEqual(['cx-ui-transfer']);
  });

  it('adds disabled modifier', () => {
    expect(resolveTransferRootClassList({ disabled: true })).toContain('cx-ui-transfer--disabled');
  });
});

describe('resolveTransferItemClassList', () => {
  it('adds checked modifier', () => {
    expect(resolveTransferItemClassList({ checked: true, disabled: false })).toContain(
      'cx-ui-transfer__item--checked',
    );
  });

  it('adds disabled modifier', () => {
    expect(resolveTransferItemClassList({ checked: false, disabled: true })).toContain(
      'cx-ui-transfer__item--disabled',
    );
  });
});

describe('resolveTransferPanelClassList', () => {
  it('adds source position', () => {
    expect(resolveTransferPanelClassList({ position: 'source' })).toContain(
      'cx-ui-transfer__panel--source',
    );
  });

  it('adds target position', () => {
    expect(resolveTransferPanelClassList({ position: 'target' })).toContain(
      'cx-ui-transfer__panel--target',
    );
  });
});

describe('CHRONIX_TRANSFER_CSS', () => {
  it('declares root BEM class', () => {
    expect(CHRONIX_TRANSFER_CSS).toContain('.cx-ui-transfer');
  });

  it('declares panel element', () => {
    expect(CHRONIX_TRANSFER_CSS).toContain('.cx-ui-transfer__panel');
  });

  it('declares item element', () => {
    expect(CHRONIX_TRANSFER_CSS).toContain('.cx-ui-transfer__item');
  });

  it('declares disabled modifier', () => {
    expect(CHRONIX_TRANSFER_CSS).toContain('.cx-ui-transfer--disabled');
  });
});

describe('ensureChronixTransferStyles', () => {
  it('injects exactly one stylesheet across repeated calls', () => {
    ensureChronixTransferStyles();
    ensureChronixTransferStyles();
    ensureChronixTransferStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="transfer"]');
    expect(styles.length).toBe(1);
  });
});
