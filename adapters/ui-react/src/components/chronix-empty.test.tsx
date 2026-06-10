import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixEmpty } from './chronix-empty.js';

describe('ChronixEmpty (react) — default rendering', () => {
  it('renders a <div> with base + medium + with-description', () => {
    const { container } = render(<ChronixEmpty />);
    const root = container.querySelector('div.cx-ui-empty')!;
    expect(root.tagName).toBe('DIV');
    expect(root.classList.contains('cx-ui-empty--medium')).toBe(true);
    expect(root.classList.contains('cx-ui-empty--with-description')).toBe(true);
  });

  it('renders __icon + __description with default text', () => {
    const { container } = render(<ChronixEmpty />);
    expect(container.querySelector('.cx-ui-empty__icon')).not.toBeNull();
    expect(container.querySelector('.cx-ui-empty__description')!.textContent).toBe('No data');
  });

  it('description prop overrides the default text', () => {
    const { container } = render(<ChronixEmpty description="Nothing yet" />);
    expect(container.querySelector('.cx-ui-empty__description')!.textContent).toBe('Nothing yet');
  });

  // description=undefined opt-out is verified at the core
  // `resolveEmptyClassList` level. The destructure default
  // `description = defaultEmptyProps.description` substitutes when
  // consumers pass `undefined`, so the React adapter level can't
  // distinguish "not provided" from "explicit undefined" without an
  // extra sentinel — not worth the API noise.
});

describe('ChronixEmpty (react) — extra slot (children)', () => {
  it('renders __extra and adds --with-extra when children supplied', () => {
    const { container } = render(
      <ChronixEmpty>
        <button type="button">Try again</button>
      </ChronixEmpty>,
    );
    expect(
      container.querySelector('div.cx-ui-empty')!.classList.contains('cx-ui-empty--with-extra'),
    ).toBe(true);
    const extra = container.querySelector('.cx-ui-empty__extra')!;
    expect(extra.textContent).toBe('Try again');
  });

  it('omits __extra and --with-extra when no children supplied', () => {
    const { container } = render(<ChronixEmpty />);
    expect(
      container.querySelector('div.cx-ui-empty')!.classList.contains('cx-ui-empty--with-extra'),
    ).toBe(false);
    expect(container.querySelector('.cx-ui-empty__extra')).toBeNull();
  });
});

describe('ChronixEmpty (react) — size prop', () => {
  it.each(['small', 'medium', 'large'] as const)('size="%s" adds the matching modifier', (s) => {
    const { container } = render(<ChronixEmpty size={s} />);
    expect(
      container.querySelector('div.cx-ui-empty')!.classList.contains(`cx-ui-empty--${s}`),
    ).toBe(true);
  });
});

describe('ChronixEmpty (react) — CSS injection', () => {
  it('mounting an empty ensures the chronix-empty stylesheet is in document.head', () => {
    render(<ChronixEmpty />);
    expect(document.head.querySelector('style[data-chronix-ui="empty"]')).not.toBeNull();
  });
});
