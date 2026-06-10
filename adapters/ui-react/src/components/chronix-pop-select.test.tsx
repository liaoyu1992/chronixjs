import { resetPopupZIndexForTests, type PopSelectOption } from '@chronixjs/ui';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ChronixPopSelect } from './chronix-pop-select.js';

const OPTS: readonly PopSelectOption[] = [
  { key: 'a', label: 'Apple', value: 'a', disabled: false },
  { key: 'b', label: 'Banana', value: 'b', disabled: false },
  { key: 'c', label: 'Cherry', value: 'c', disabled: true },
];

describe('ChronixPopSelect (react)', () => {
  beforeEach(() => {
    resetPopupZIndexForTests();
  });
  afterEach(() => {
    cleanup();
  });

  it('renders 3 option items when show=true', () => {
    render(
      <ChronixPopSelect show trigger="manual" options={OPTS}>
        <button>select</button>
      </ChronixPopSelect>,
    );
    const list = document.querySelector('.cx-ui-pop-select__list');
    expect(list).not.toBeNull();
    expect(list!.querySelectorAll('.cx-ui-pop-select__option')).toHaveLength(3);
  });

  it('marks selected option with --active', () => {
    render(
      <ChronixPopSelect show trigger="manual" options={OPTS} value="b">
        <button />
      </ChronixPopSelect>,
    );
    const options = document.querySelectorAll('.cx-ui-pop-select__option');
    expect(options[1]!.classList.contains('cx-ui-pop-select__option--active')).toBe(true);
  });

  it('marks disabled option with --disabled', () => {
    render(
      <ChronixPopSelect show trigger="manual" options={OPTS}>
        <button />
      </ChronixPopSelect>,
    );
    const options = document.querySelectorAll('.cx-ui-pop-select__option');
    expect(options[2]!.classList.contains('cx-ui-pop-select__option--disabled')).toBe(true);
  });

  it('injects the chronix-pop-select stylesheet', () => {
    render(<ChronixPopSelect options={OPTS} />);
    expect(document.head.querySelector('style[data-chronix-ui="pop-select"]')).not.toBeNull();
  });
});
