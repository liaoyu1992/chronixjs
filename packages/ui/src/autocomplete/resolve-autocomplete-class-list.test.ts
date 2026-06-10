import { describe, expect, it } from 'vitest';

import { defaultAutoCompleteProps, type AutoCompleteProps } from './autocomplete-spec.js';
import { resolveAutoCompleteClassList } from './resolve-autocomplete-class-list.js';

function props(over: Partial<AutoCompleteProps> = {}): AutoCompleteProps {
  return { ...defaultAutoCompleteProps, ...over };
}

describe('resolveAutoCompleteClassList', () => {
  it('returns base + --medium for defaults (closed)', () => {
    expect(resolveAutoCompleteClassList({ props: props(), open: false })).toEqual([
      'cx-ui-autocomplete',
      'cx-ui-autocomplete--medium',
    ]);
  });

  it('adds --open when open=true', () => {
    expect(resolveAutoCompleteClassList({ props: props(), open: true })).toContain(
      'cx-ui-autocomplete--open',
    );
  });

  it('emits --disabled + --invalid when set', () => {
    const classes = resolveAutoCompleteClassList({
      props: props({ disabled: true, error: 'oops' }),
      open: false,
    });
    expect(classes).toContain('cx-ui-autocomplete--disabled');
    expect(classes).toContain('cx-ui-autocomplete--invalid');
  });

  it('emits --large for size=large', () => {
    expect(
      resolveAutoCompleteClassList({
        props: props({ size: 'large' }),
        open: false,
      }),
    ).toContain('cx-ui-autocomplete--large');
  });
});
