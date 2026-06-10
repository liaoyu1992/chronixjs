import { describe, expect, it } from 'vitest';

import { resolveListItemClassList } from './resolve-list-item-class-list.js';

import type { ListItem } from './list-spec.js';

function item(over: Partial<ListItem> = {}): ListItem {
  return {
    key: 'k',
    title: 'Title',
    description: undefined,
    prefix: undefined,
    suffix: undefined,
    ...over,
  };
}

describe('resolveListItemClassList', () => {
  it('returns base only for items with no optional fields', () => {
    expect(resolveListItemClassList(item())).toEqual(['cx-ui-list__item']);
  });

  it('adds --with-prefix when item.prefix is defined', () => {
    expect(resolveListItemClassList(item({ prefix: '★' }))).toContain(
      'cx-ui-list__item--with-prefix',
    );
  });

  it('adds --with-suffix when item.suffix is defined', () => {
    expect(resolveListItemClassList(item({ suffix: 'NEW' }))).toContain(
      'cx-ui-list__item--with-suffix',
    );
  });

  it('adds --with-description when item.description is defined', () => {
    expect(resolveListItemClassList(item({ description: 'Desc' }))).toContain(
      'cx-ui-list__item--with-description',
    );
  });

  it('combines all 3 conditional modifiers when all fields present', () => {
    expect(
      resolveListItemClassList(item({ prefix: '★', suffix: 'NEW', description: 'Desc' })),
    ).toEqual([
      'cx-ui-list__item',
      'cx-ui-list__item--with-prefix',
      'cx-ui-list__item--with-suffix',
      'cx-ui-list__item--with-description',
    ]);
  });

  it('distinguishes empty string from undefined (empty string IS "defined")', () => {
    // empty-string is `!== undefined` per JS truthiness rules — the
    // modifier is emitted. Consumers wanting opt-out pass undefined.
    expect(resolveListItemClassList(item({ prefix: '' }))).toContain(
      'cx-ui-list__item--with-prefix',
    );
  });

  it('omits modifier when field is undefined even with whitespace-like string elsewhere', () => {
    expect(resolveListItemClassList(item({ description: ' ' }))).toContain(
      'cx-ui-list__item--with-description',
    );
    expect(resolveListItemClassList(item({ description: ' ' }))).not.toContain(
      'cx-ui-list__item--with-prefix',
    );
  });

  it('returns a fresh array per call', () => {
    expect(resolveListItemClassList(item())).not.toBe(resolveListItemClassList(item()));
  });
});
