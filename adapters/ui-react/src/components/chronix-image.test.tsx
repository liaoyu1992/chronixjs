import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ChronixImage } from './chronix-image.js';

describe('ChronixImage (react)', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders an <img> with the given src + alt + objectFit inline', () => {
    const { container } = render(
      <ChronixImage src="https://example.com/x.png" alt="pic" objectFit="contain" />,
    );
    const img = container.querySelector<HTMLElement>('img.cx-ui-image')!;
    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toBe('https://example.com/x.png');
    expect(img.getAttribute('alt')).toBe('pic');
    expect(img.style.objectFit).toBe('contain');
  });

  it('attaches loading="lazy" when lazy=true (default)', () => {
    const { container } = render(<ChronixImage src="x" />);
    expect(container.querySelector('img')?.getAttribute('loading')).toBe('lazy');
  });

  it('omits loading attribute when lazy=false', () => {
    const { container } = render(<ChronixImage src="x" lazy={false} />);
    expect(container.querySelector('img')?.getAttribute('loading')).toBeNull();
  });

  it('adds --previewable modifier when previewable=true', () => {
    const { container } = render(<ChronixImage src="x" previewable />);
    expect(container.querySelector('img')?.classList.contains('cx-ui-image--previewable')).toBe(
      true,
    );
  });

  it('falls back to fallback src after error event', () => {
    const { container } = render(<ChronixImage src="primary.png" fallback="fb.png" />);
    const img = container.querySelector('img')!;
    fireEvent.error(img);
    expect(img.getAttribute('src')).toBe('fb.png');
    expect(img.classList.contains('cx-ui-image--failed')).toBe(true);
  });

  it('injects the chronix-image stylesheet', () => {
    render(<ChronixImage src="x" />);
    expect(document.head.querySelector('style[data-chronix-ui="image"]')).not.toBeNull();
  });
});
