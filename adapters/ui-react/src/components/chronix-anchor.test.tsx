// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ChronixAnchor } from './chronix-anchor.js';

describe('ChronixAnchor (react)', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the nav element with base class and data-testid', () => {
    const items = [
      { key: 'a', label: 'Section A', href: '#a' },
      { key: 'b', label: 'Section B', href: '#b' },
    ];
    const { container } = render(<ChronixAnchor items={items} />);
    const root = container.querySelector('[data-testid="anchor-root"]');
    expect(root).not.toBeNull();
    expect(root!.tagName).toBe('NAV');
    expect(root!.classList.contains('cx-ui-anchor')).toBe(true);
  });

  it('mounting ensures the chronix-anchor stylesheet is in document.head', () => {
    render(<ChronixAnchor items={[]} />);
    expect(document.head.querySelector('style[data-chronix-ui="anchor"]')).not.toBeNull();
  });
});
