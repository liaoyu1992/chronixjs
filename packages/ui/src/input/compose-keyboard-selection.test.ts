import { describe, expect, it } from 'vitest';

import { composeKeyboardSelection } from './compose-keyboard-selection.js';

const KEYS = ['a', 'b', 'c', 'd'];

describe('composeKeyboardSelection — down', () => {
  it('null current → first key', () => {
    expect(
      composeKeyboardSelection({ currentKey: null, availableKeys: KEYS, direction: 'down' }),
    ).toBe('a');
  });

  it('mid-list current → next key', () => {
    expect(
      composeKeyboardSelection({ currentKey: 'b', availableKeys: KEYS, direction: 'down' }),
    ).toBe('c');
  });

  it('last current → last (no wrap)', () => {
    expect(
      composeKeyboardSelection({ currentKey: 'd', availableKeys: KEYS, direction: 'down' }),
    ).toBe('d');
  });

  it('last current with wrap → first', () => {
    expect(
      composeKeyboardSelection({
        currentKey: 'd',
        availableKeys: KEYS,
        direction: 'down',
        wrap: true,
      }),
    ).toBe('a');
  });
});

describe('composeKeyboardSelection — up', () => {
  it('null current → last key', () => {
    expect(
      composeKeyboardSelection({ currentKey: null, availableKeys: KEYS, direction: 'up' }),
    ).toBe('d');
  });

  it('mid-list current → previous key', () => {
    expect(
      composeKeyboardSelection({ currentKey: 'c', availableKeys: KEYS, direction: 'up' }),
    ).toBe('b');
  });

  it('first current → first (no wrap)', () => {
    expect(
      composeKeyboardSelection({ currentKey: 'a', availableKeys: KEYS, direction: 'up' }),
    ).toBe('a');
  });

  it('first current with wrap → last', () => {
    expect(
      composeKeyboardSelection({
        currentKey: 'a',
        availableKeys: KEYS,
        direction: 'up',
        wrap: true,
      }),
    ).toBe('d');
  });
});

describe('composeKeyboardSelection — home / end', () => {
  it('home → first regardless of current', () => {
    expect(
      composeKeyboardSelection({ currentKey: 'c', availableKeys: KEYS, direction: 'home' }),
    ).toBe('a');
    expect(
      composeKeyboardSelection({ currentKey: null, availableKeys: KEYS, direction: 'home' }),
    ).toBe('a');
  });

  it('end → last regardless of current', () => {
    expect(
      composeKeyboardSelection({ currentKey: 'b', availableKeys: KEYS, direction: 'end' }),
    ).toBe('d');
    expect(
      composeKeyboardSelection({ currentKey: null, availableKeys: KEYS, direction: 'end' }),
    ).toBe('d');
  });
});

describe('composeKeyboardSelection — edge cases', () => {
  it('empty availableKeys → null for any direction', () => {
    expect(
      composeKeyboardSelection({ currentKey: null, availableKeys: [], direction: 'down' }),
    ).toBeNull();
    expect(
      composeKeyboardSelection({ currentKey: 'a', availableKeys: [], direction: 'home' }),
    ).toBeNull();
  });

  it('currentKey not in availableKeys → treated as no current (down → first, up → last)', () => {
    expect(
      composeKeyboardSelection({ currentKey: 'zzz', availableKeys: KEYS, direction: 'down' }),
    ).toBe('a');
    expect(
      composeKeyboardSelection({ currentKey: 'zzz', availableKeys: KEYS, direction: 'up' }),
    ).toBe('d');
  });

  it('single-element list: down/up stays put without wrap', () => {
    expect(
      composeKeyboardSelection({ currentKey: 'only', availableKeys: ['only'], direction: 'down' }),
    ).toBe('only');
    expect(
      composeKeyboardSelection({ currentKey: 'only', availableKeys: ['only'], direction: 'up' }),
    ).toBe('only');
  });

  it('single-element list with wrap also stays put', () => {
    expect(
      composeKeyboardSelection({
        currentKey: 'only',
        availableKeys: ['only'],
        direction: 'down',
        wrap: true,
      }),
    ).toBe('only');
  });

  it('numeric keys work the same way', () => {
    expect(
      composeKeyboardSelection({ currentKey: 2, availableKeys: [1, 2, 3, 4], direction: 'down' }),
    ).toBe(3);
  });
});
