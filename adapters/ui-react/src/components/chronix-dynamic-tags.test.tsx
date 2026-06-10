// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ChronixDynamicTags } from './chronix-dynamic-tags.js';

describe('ChronixDynamicTags (react)', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the root div with base class and data-testid', () => {
    const { container } = render(<ChronixDynamicTags value={['tag1', 'tag2']} />);
    const root = container.querySelector('[data-testid="dynamic-tags-root"]');
    expect(root).not.toBeNull();
    expect(root!.classList.contains('cx-ui-dynamic-tags')).toBe(true);
  });

  it('mounting ensures the chronix-dynamic-tags stylesheet is in document.head', () => {
    render(<ChronixDynamicTags value={[]} />);
    expect(document.head.querySelector('style[data-chronix-ui="dynamic-tags"]')).not.toBeNull();
  });
});
