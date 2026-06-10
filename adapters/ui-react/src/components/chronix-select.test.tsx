import { resetPopupZIndexForTests, type SelectOption } from '@chronixjs/ui';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ChronixSelect } from './chronix-select.js';

const OPTS: readonly SelectOption[] = [
  { key: 'a', label: 'Apple', value: 'a' },
  { key: 'b', label: 'Banana', value: 'b' },
  { key: 'c', label: 'Cherry', value: 'c', disabled: true },
];

describe('ChronixSelect (react)', () => {
  beforeEach(() => {
    resetPopupZIndexForTests();
  });
  afterEach(() => {
    cleanup();
  });

  it('renders root with data-testid select-root', () => {
    render(<ChronixSelect options={OPTS} />);
    expect(document.querySelector('[data-testid="select-root"]')).not.toBeNull();
  });

  it('shows options when show=true', () => {
    render(<ChronixSelect options={OPTS} show />);
    const dropdown = document.querySelector('[data-testid="select-dropdown-popup"]');
    expect(dropdown).not.toBeNull();
    const options = dropdown!.querySelectorAll('.cx-ui-select__option');
    expect(options).toHaveLength(3);
  });

  it('marks selected option with --selected', () => {
    render(<ChronixSelect options={OPTS} show value="b" />);
    const options = document.querySelectorAll('.cx-ui-select__option');
    expect(options[1]!.classList.contains('cx-ui-select__option--selected')).toBe(true);
  });

  it('renders tags in multiple mode', () => {
    render(<ChronixSelect options={OPTS} multiple value={['a', 'b']} />);
    const tags = document.querySelectorAll('.cx-ui-select__tag');
    expect(tags).toHaveLength(2);
  });

  it('shows filter input when filterable', () => {
    render(<ChronixSelect options={OPTS} filterable show />);
    const input = document.querySelector('[data-testid="select-filter-input"]');
    expect(input).not.toBeNull();
  });

  it('injects the chronix-select stylesheet', () => {
    render(<ChronixSelect options={OPTS} />);
    expect(document.head.querySelector('style[data-chronix-ui="select"]')).not.toBeNull();
  });
});
