// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ChronixScrollbar } from './chronix-scrollbar.js';

describe('ChronixScrollbar (react)', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the root div with base class and data-testid', () => {
    const { container } = render(<ChronixScrollbar>Content</ChronixScrollbar>);
    const root = container.querySelector('[data-testid="scrollbar-root"]');
    expect(root).not.toBeNull();
    expect(root!.classList.contains('cx-ui-scrollbar')).toBe(true);
    expect(root!.textContent).toContain('Content');
  });

  it('mounting ensures the chronix-scrollbar stylesheet is in document.head', () => {
    render(<ChronixScrollbar>Content</ChronixScrollbar>);
    expect(document.head.querySelector('style[data-chronix-ui="scrollbar"]')).not.toBeNull();
  });
});
