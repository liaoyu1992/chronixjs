import { describe, expect, it } from 'vitest';

import {
  defaultDescriptionsProps,
  type DescriptionItem,
  type DescriptionsProps,
} from './descriptions-spec.js';

describe('defaultDescriptionsProps', () => {
  it('matches the documented defaults', () => {
    expect(defaultDescriptionsProps).toEqual({
      items: [],
      columns: 3,
      bordered: false,
      labelPlacement: 'left',
      size: 'medium',
      title: undefined,
    });
  });

  it('is a DescriptionsProps-shape that adapters can spread', () => {
    const items: DescriptionItem[] = [
      { key: 'name', label: 'Name', value: 'Liao Yu', span: 1 },
      { key: 'email', label: 'Email', value: 'liao@chronix.dev', span: 1 },
      { key: 'bio', label: 'Bio', value: 'Spans full row.', span: 3 },
    ];
    const override: DescriptionsProps = {
      ...defaultDescriptionsProps,
      items,
      columns: 3,
      title: 'Profile',
    };
    expect(override.items).toHaveLength(3);
    expect(override.title).toBe('Profile');
    expect(override.items[2]!.span).toBe(3);
  });
});

describe('DescriptionItem shape', () => {
  it('accepts span values from 1 to N', () => {
    for (const span of [1, 2, 3, 12] as const) {
      const item: DescriptionItem = {
        key: 'k',
        label: 'L',
        value: 'V',
        span,
      };
      expect(item.span).toBe(span);
    }
  });

  it('accepts arbitrary string labels and values', () => {
    const item: DescriptionItem = {
      key: 'k',
      label: '会员等级',
      value: 'Gold ⭐',
      span: 1,
    };
    expect(item.label).toBe('会员等级');
    expect(item.value).toBe('Gold ⭐');
  });
});

describe('DescriptionsProps closed unions', () => {
  it('accepts all 3 size variants', () => {
    for (const size of ['small', 'medium', 'large'] as const) {
      const props: DescriptionsProps = { ...defaultDescriptionsProps, size };
      expect(props.size).toBe(size);
    }
  });

  it('accepts both label placement variants', () => {
    for (const labelPlacement of ['left', 'top'] as const) {
      const props: DescriptionsProps = {
        ...defaultDescriptionsProps,
        labelPlacement,
      };
      expect(props.labelPlacement).toBe(labelPlacement);
    }
  });
});
