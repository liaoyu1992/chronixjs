import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixAvatar } from './chronix-avatar.js';

describe('ChronixAvatar (react)', () => {
  it('renders <span> base + --circle by default', () => {
    const { container } = render(<ChronixAvatar text="AB" />);
    const root = container.querySelector('.cx-ui-avatar')!;
    expect(root.tagName).toBe('SPAN');
    expect(root.classList.contains('cx-ui-avatar--circle')).toBe(true);
  });

  it('renders text when src undefined', () => {
    const { container } = render(<ChronixAvatar text="CD" />);
    expect(container.querySelector('.cx-ui-avatar')!.textContent).toBe('CD');
    expect(container.querySelector('img')).toBeNull();
  });

  it('renders <img> when src set', () => {
    const { container } = render(<ChronixAvatar src="/a.png" text="EF" />);
    expect(container.querySelector('img')!.getAttribute('src')).toBe('/a.png');
  });

  it.each(['circle', 'square', 'round'] as const)('applies --%s modifier per shape', (shape) => {
    const { container } = render(<ChronixAvatar shape={shape} text="X" />);
    expect(
      container.querySelector('.cx-ui-avatar')!.classList.contains(`cx-ui-avatar--${shape}`),
    ).toBe(true);
  });

  it('injects the stylesheet', () => {
    render(<ChronixAvatar />);
    expect(document.head.querySelector('style[data-chronix-ui="avatar"]')).not.toBeNull();
  });
});
