import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixWatermark } from './chronix-watermark.js';

describe('ChronixWatermark (react) — root rendering', () => {
  it('renders a <div> with the base class', () => {
    const { container } = render(<ChronixWatermark />);
    const root = container.querySelector('div.cx-ui-watermark')!;
    expect(root.tagName).toBe('DIV');
  });

  it('renders a __content child', () => {
    const { container } = render(<ChronixWatermark />);
    expect(container.querySelector('.cx-ui-watermark__content')).not.toBeNull();
  });

  it('renders children inside __content', () => {
    const { container } = render(
      <ChronixWatermark>
        <p data-testid="inner">Hello</p>
      </ChronixWatermark>,
    );
    expect(
      container.querySelector('.cx-ui-watermark__content [data-testid="inner"]')!.textContent,
    ).toBe('Hello');
  });
});

describe('ChronixWatermark (react) — inline style', () => {
  it('emits background-image with a SVG data URL', () => {
    const { container } = render(<ChronixWatermark content="DRAFT" />);
    const root = container.querySelector('div.cx-ui-watermark')!;
    const style = root.getAttribute('style') ?? '';
    expect(style).toContain('background-image');
    expect(style).toContain('data:image/svg+xml');
  });

  it('emits background-size matching width / height props', () => {
    const { container } = render(<ChronixWatermark width={300} height={100} />);
    const style = container.querySelector('div.cx-ui-watermark')!.getAttribute('style') ?? '';
    expect(style).toContain('background-size');
    expect(style).toContain('300px');
    expect(style).toContain('100px');
  });
});

describe('ChronixWatermark (react) — CSS injection', () => {
  it('mounting ensures the chronix-watermark stylesheet is in document.head', () => {
    render(<ChronixWatermark />);
    expect(document.head.querySelector('style[data-chronix-ui="watermark"]')).not.toBeNull();
  });
});
