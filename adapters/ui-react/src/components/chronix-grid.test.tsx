import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixGrid } from './chronix-grid.js';

describe('ChronixGrid (react) — default rendering', () => {
  it('renders a <div> with base class only', () => {
    const { container } = render(<ChronixGrid />);
    const root = container.querySelector('div.cx-ui-grid')!;
    expect(root.tagName).toBe('DIV');
  });

  it('omits all inline-style declarations when all props are undefined', () => {
    const { container } = render(<ChronixGrid />);
    const root = container.querySelector<HTMLElement>('div.cx-ui-grid')!;
    expect(root.style.gridTemplateColumns).toBe('');
    expect(root.style.columnGap).toBe('');
    expect(root.style.rowGap).toBe('');
  });

  it('renders children', () => {
    const { container } = render(
      <ChronixGrid>
        <span className="child">child</span>
      </ChronixGrid>,
    );
    expect(container.querySelector('.child')!.textContent).toBe('child');
  });
});

describe('ChronixGrid (react) — cols prop', () => {
  it('numeric cols renders grid-template-columns: repeat(N, minmax(0, 1fr))', () => {
    const { container } = render(<ChronixGrid cols={4} />);
    const root = container.querySelector<HTMLElement>('div.cx-ui-grid')!;
    expect(root.style.gridTemplateColumns).toBe('repeat(4, minmax(0, 1fr))');
  });

  it('string cols passes verbatim', () => {
    const { container } = render(<ChronixGrid cols="120px 1fr 120px" />);
    const root = container.querySelector<HTMLElement>('div.cx-ui-grid')!;
    expect(root.style.gridTemplateColumns).toBe('120px 1fr 120px');
  });

  it('cols=0 collapses to no inline declaration', () => {
    const { container } = render(<ChronixGrid cols={0} />);
    const root = container.querySelector<HTMLElement>('div.cx-ui-grid')!;
    expect(root.style.gridTemplateColumns).toBe('');
  });
});

describe('ChronixGrid (react) — xGap + yGap props', () => {
  it('xGap applies inline style column-gap', () => {
    const { container } = render(<ChronixGrid xGap={16} />);
    const root = container.querySelector<HTMLElement>('div.cx-ui-grid')!;
    expect(root.style.columnGap).toBe('16px');
  });

  it('yGap applies inline style row-gap', () => {
    const { container } = render(<ChronixGrid yGap={8} />);
    const root = container.querySelector<HTMLElement>('div.cx-ui-grid')!;
    expect(root.style.rowGap).toBe('8px');
  });

  it('both xGap + yGap render together', () => {
    const { container } = render(<ChronixGrid xGap={16} yGap={8} />);
    const root = container.querySelector<HTMLElement>('div.cx-ui-grid')!;
    expect(root.style.columnGap).toBe('16px');
    expect(root.style.rowGap).toBe('8px');
  });
});

describe('ChronixGrid (react) — inline modifier', () => {
  it('adds --inline when inline=true', () => {
    const { container } = render(<ChronixGrid inline />);
    expect(
      container.querySelector('div.cx-ui-grid')!.classList.contains('cx-ui-grid--inline'),
    ).toBe(true);
  });
});

describe('ChronixGrid (react) — CSS injection', () => {
  it('mounting ensures the chronix-grid stylesheet is in document.head', () => {
    render(<ChronixGrid />);
    expect(document.head.querySelector('style[data-chronix-ui="grid"]')).not.toBeNull();
  });
});
