import { describe, expect, it } from 'vitest';

import { defaultListProps, type ListItem, type ListProps } from './list-spec.js';

describe('defaultListProps', () => {
  it('matches the documented defaults', () => {
    expect(defaultListProps).toEqual({
      items: [],
      bordered: false,
      hoverable: false,
      showDivider: true,
      size: 'medium',
    });
  });

  it('is a ListProps-shape that adapters can spread', () => {
    const items: ListItem[] = [
      {
        key: 'docs',
        title: 'Documents',
        description: '14 items',
        prefix: '📁',
        suffix: '→',
      },
      {
        key: 'plain',
        title: 'Plain row',
        description: undefined,
        prefix: undefined,
        suffix: undefined,
      },
    ];
    const override: ListProps = {
      ...defaultListProps,
      items,
      bordered: true,
      hoverable: true,
    };
    expect(override.items).toHaveLength(2);
    expect(override.bordered).toBe(true);
    expect(override.hoverable).toBe(true);
  });
});

describe('ListItem shape', () => {
  it('accepts items with all optional fields populated', () => {
    const item: ListItem = {
      key: 'k',
      title: 'Title',
      description: 'Desc',
      prefix: '★',
      suffix: 'NEW',
    };
    expect(item.title).toBe('Title');
    expect(item.description).toBe('Desc');
    expect(item.prefix).toBe('★');
    expect(item.suffix).toBe('NEW');
  });

  it('accepts items with all optional fields undefined', () => {
    const item: ListItem = {
      key: 'k',
      title: 'Title',
      description: undefined,
      prefix: undefined,
      suffix: undefined,
    };
    expect(item.description).toBeUndefined();
    expect(item.prefix).toBeUndefined();
    expect(item.suffix).toBeUndefined();
  });
});

describe('ListProps closed unions', () => {
  it('accepts all 3 size variants', () => {
    for (const size of ['small', 'medium', 'large'] as const) {
      const props: ListProps = { ...defaultListProps, size };
      expect(props.size).toBe(size);
    }
  });
});
