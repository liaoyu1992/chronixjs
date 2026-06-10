// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ChronixInfiniteScroll } from './chronix-infinite-scroll.js';

describe('ChronixInfiniteScroll (react)', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the root div with base class and data-testid', () => {
    const { container } = render(<ChronixInfiniteScroll>Content</ChronixInfiniteScroll>);
    const root = container.querySelector('[data-testid="infinite-scroll-root"]');
    expect(root).not.toBeNull();
    expect(root!.classList.contains('cx-ui-infinite-scroll')).toBe(true);
    expect(root!.textContent).toContain('Content');
  });

  it('mounting ensures the chronix-infinite-scroll stylesheet is in document.head', () => {
    render(<ChronixInfiniteScroll>Content</ChronixInfiniteScroll>);
    expect(document.head.querySelector('style[data-chronix-ui="infinite-scroll"]')).not.toBeNull();
  });
});
