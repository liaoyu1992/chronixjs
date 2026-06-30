import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixDivider } from './chronix-divider.js';

/**
 * — Divider mount tests (react). Verbatim port
 * of the vue3 Divider suite to `@testing-library/react`.
 */

describe('ChronixDivider (react) — default rendering', () => {
  it('renders a <div> with role="separator" and horizontal class', () => {
    const { container } = render(<ChronixDivider />);
    const div = container.querySelector('div.cx-ui-divider')!;
    expect(div.tagName).toBe('DIV');
    expect(div.getAttribute('role')).toBe('separator');
    expect(div.classList.contains('cx-ui-divider--horizontal')).toBe(true);
  });

  it('omits --with-title and __title element when no children are supplied', () => {
    const { container } = render(<ChronixDivider />);
    const div = container.querySelector('div.cx-ui-divider')!;
    expect(div.classList.contains('cx-ui-divider--with-title')).toBe(false);
    expect(container.querySelector('.cx-ui-divider__title')).toBeNull();
  });
});

describe('ChronixDivider (react) — title slot', () => {
  it('renders a __title span and adds --with-title + --title-center when children non-empty', () => {
    const { container } = render(<ChronixDivider>Title</ChronixDivider>);
    const div = container.querySelector('div.cx-ui-divider')!;
    expect(div.classList.contains('cx-ui-divider--with-title')).toBe(true);
    expect(div.classList.contains('cx-ui-divider--title-center')).toBe(true);
    const title = container.querySelector('.cx-ui-divider__title')!;
    expect(title).not.toBeNull();
    expect(title.textContent).toBe('Title');
  });

  it.each(['left', 'center', 'right'] as const)(
    'titlePlacement="%s" adds the matching modifier when title is present',
    (p) => {
      const { container } = render(<ChronixDivider titlePlacement={p}>T</ChronixDivider>);
      expect(
        container
          .querySelector('div.cx-ui-divider')!
          .classList.contains(`cx-ui-divider--title-${p}`),
      ).toBe(true);
    },
  );
});

describe('ChronixDivider (react) — vertical mode', () => {
  it('vertical={true} emits --vertical (not --horizontal)', () => {
    const { container } = render(<ChronixDivider vertical />);
    const div = container.querySelector('div.cx-ui-divider')!;
    expect(div.classList.contains('cx-ui-divider--vertical')).toBe(true);
    expect(div.classList.contains('cx-ui-divider--horizontal')).toBe(false);
  });

  it('vertical={true} suppresses title rendering even when children supplied', () => {
    const { container } = render(<ChronixDivider vertical>should-not-appear</ChronixDivider>);
    const div = container.querySelector('div.cx-ui-divider')!;
    expect(div.classList.contains('cx-ui-divider--with-title')).toBe(false);
    expect(container.querySelector('.cx-ui-divider__title')).toBeNull();
    expect(div.textContent).toBe('');
  });
});

describe('ChronixDivider (react) — dashed prop', () => {
  it('dashed={true} adds --dashed class', () => {
    const { container } = render(<ChronixDivider dashed />);
    expect(
      container.querySelector('div.cx-ui-divider')!.classList.contains('cx-ui-divider--dashed'),
    ).toBe(true);
  });
});

describe('ChronixDivider (react) — CSS injection', () => {
  it('mounting any divider ensures the chronix-divider stylesheet is in document.head', () => {
    render(<ChronixDivider />);
    const style = document.head.querySelector('style[data-chronix-ui="divider"]');
    expect(style).not.toBeNull();
    expect(style!.textContent).toContain('.cx-ui-divider');
  });

  it('multiple mounts inject only one stylesheet (idempotent)', () => {
    render(<ChronixDivider />);
    render(<ChronixDivider />);
    render(<ChronixDivider />);
    const styles = document.head.querySelectorAll('style[data-chronix-ui="divider"]');
    expect(styles.length).toBe(1);
  });
});
