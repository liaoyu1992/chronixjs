import { describe, expect, it } from 'vitest';

import { defaultCascaderProps, resolveCascaderPathLabels } from './cascader-spec.js';

import type { SelectOption } from '../select/option-spec.js';

describe('defaultCascaderProps', () => {
  it('has correct defaults', () => {
    expect(defaultCascaderProps).toEqual({
      value: undefined,
      options: [],
      multiple: false,
      clearable: false,
      placeholder: '',
      disabled: false,
      placement: 'bottom-start',
    });
  });
});

describe('resolveCascaderPathLabels', () => {
  const options: SelectOption[] = [
    {
      key: 'zhejiang',
      label: 'Zhejiang',
      children: [
        { key: 'hangzhou', label: 'Hangzhou', value: 'hangzhou' },
        { key: 'ningbo', label: 'Ningbo', value: 'ningbo' },
      ],
    },
    {
      key: 'jiangsu',
      label: 'Jiangsu',
      children: [{ key: 'nanjing', label: 'Nanjing', value: 'nanjing' }],
    },
  ];

  it('resolves path labels for leaf node', () => {
    expect(resolveCascaderPathLabels(options, 'hangzhou')).toEqual(['Zhejiang', 'Hangzhou']);
  });

  it('resolves path labels for another leaf', () => {
    expect(resolveCascaderPathLabels(options, 'nanjing')).toEqual(['Jiangsu', 'Nanjing']);
  });

  it('returns empty for unknown key', () => {
    expect(resolveCascaderPathLabels(options, 'unknown')).toEqual([]);
  });

  it('returns empty for empty options', () => {
    expect(resolveCascaderPathLabels([], 'x')).toEqual([]);
  });
});
