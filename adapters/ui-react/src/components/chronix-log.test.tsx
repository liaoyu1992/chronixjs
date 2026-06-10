import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixLog } from './chronix-log.js';

const LINES = ['first line', 'second line', 'third line'];

describe('ChronixLog (react) — root rendering', () => {
  it('renders a <div> with the base class only by default', () => {
    const { container } = render(<ChronixLog lines={LINES} />);
    const root = container.querySelector('div.cx-ui-log')!;
    expect(root.tagName).toBe('DIV');
    expect(root.classList.contains('cx-ui-log--with-line-numbers')).toBe(false);
    expect(root.classList.contains('cx-ui-log--loading')).toBe(false);
    expect(root.classList.contains('cx-ui-log--wrap-lines')).toBe(false);
  });

  it('renders the __lines container as an <ol>', () => {
    const { container } = render(<ChronixLog lines={LINES} />);
    const linesEl = container.querySelector('.cx-ui-log__lines')!;
    expect(linesEl.tagName).toBe('OL');
  });

  it('renders one <li> per lines entry with the text content', () => {
    const { container } = render(<ChronixLog lines={LINES} />);
    const items = container.querySelectorAll('.cx-ui-log__line');
    expect(items.length).toBe(LINES.length);
    items.forEach((item, idx) => {
      expect(item.querySelector('.cx-ui-log__line-content')!.textContent).toBe(LINES[idx]);
    });
  });
});

describe('ChronixLog (react) — lineNumbers', () => {
  it('renders no __line-number span by default', () => {
    const { container } = render(<ChronixLog lines={LINES} />);
    expect(container.querySelectorAll('.cx-ui-log__line-number').length).toBe(0);
  });

  it('renders __line-number text 1..N when lineNumbers=true', () => {
    const { container } = render(<ChronixLog lines={LINES} lineNumbers />);
    const root = container.querySelector('div.cx-ui-log')!;
    expect(root.classList.contains('cx-ui-log--with-line-numbers')).toBe(true);
    const numbers = container.querySelectorAll('.cx-ui-log__line-number');
    expect(numbers.length).toBe(LINES.length);
    numbers.forEach((n, idx) => {
      expect(n.textContent).toBe(String(idx + 1));
      expect(n.getAttribute('aria-hidden')).toBe('true');
    });
  });
});

describe('ChronixLog (react) — loading row', () => {
  it('renders the __loading row when loading=true', () => {
    const { container } = render(<ChronixLog lines={LINES} loading />);
    const root = container.querySelector('div.cx-ui-log')!;
    expect(root.classList.contains('cx-ui-log--loading')).toBe(true);
    const loading = container.querySelector('.cx-ui-log__loading')!;
    expect(loading.textContent).toBe('loading...');
  });

  it('omits the __loading row by default', () => {
    const { container } = render(<ChronixLog lines={LINES} />);
    expect(container.querySelector('.cx-ui-log__loading')).toBeNull();
  });
});

describe('ChronixLog (react) — maxHeight inline style', () => {
  it('sets style.maxHeight and overflow when maxHeight is defined', () => {
    const { container } = render(<ChronixLog lines={LINES} maxHeight={200} />);
    const root = container.querySelector<HTMLElement>('div.cx-ui-log')!;
    expect(root.style.maxHeight).toBe('200px');
    expect(root.style.overflow).toBe('auto');
  });

  it('does not set maxHeight or overflow when maxHeight is undefined', () => {
    const { container } = render(<ChronixLog lines={LINES} />);
    const root = container.querySelector<HTMLElement>('div.cx-ui-log')!;
    expect(root.style.maxHeight).toBe('');
    expect(root.style.overflow).toBe('');
  });
});

describe('ChronixLog (react) — wrapLines', () => {
  it('adds --wrap-lines modifier when wrapLines=true', () => {
    const { container } = render(<ChronixLog lines={LINES} wrapLines />);
    expect(
      container.querySelector('div.cx-ui-log')!.classList.contains('cx-ui-log--wrap-lines'),
    ).toBe(true);
  });
});

describe('ChronixLog (react) — CSS injection', () => {
  it('mounting ensures the chronix-log stylesheet is in document.head', () => {
    render(<ChronixLog lines={LINES} />);
    expect(document.head.querySelector('style[data-chronix-ui="log"]')).not.toBeNull();
  });
});
