import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixAutoComplete } from './chronix-autocomplete.js';

import type { AutoCompleteOption } from '@chronixjs/ui';

const OPTIONS: readonly AutoCompleteOption[] = [
  { key: 'a', label: 'Apple', value: 'apple' },
  { key: 'b', label: 'Banana', value: 'banana' },
  { key: 'c', label: 'apricot', value: 'apricot' },
];

describe('ChronixAutoComplete (react)', () => {
  it('renders <div> root with closed list by default', () => {
    const { container } = render(<ChronixAutoComplete options={OPTIONS} />);
    expect(container.querySelector('.cx-ui-autocomplete')!.tagName).toBe('DIV');
    expect(container.querySelector('.cx-ui-autocomplete__list')).toBeNull();
  });

  it('opens list on focus + filters by query', () => {
    const { container } = render(
      <ChronixAutoComplete
        options={OPTIONS}
        value="ap"
        onChange={() => {
          /* track change */
        }}
      />,
    );
    fireEvent.focus(container.querySelector('input')!);
    expect(container.querySelector('.cx-ui-autocomplete__list')).not.toBeNull();
    expect(container.querySelectorAll('.cx-ui-autocomplete__option')).toHaveLength(2);
  });

  it('renders error row + --invalid', () => {
    const { container } = render(<ChronixAutoComplete options={OPTIONS} error="pick one" />);
    expect(
      container
        .querySelector('.cx-ui-autocomplete')!
        .classList.contains('cx-ui-autocomplete--invalid'),
    ).toBe(true);
    expect(container.querySelector('.cx-ui-autocomplete__error')!.textContent).toBe('pick one');
  });

  it('injects the chronix-autocomplete stylesheet', () => {
    render(<ChronixAutoComplete options={OPTIONS} />);
    expect(document.head.querySelector('style[data-chronix-ui="autocomplete"]')).not.toBeNull();
  });
});
