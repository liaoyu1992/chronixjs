// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ChronixDynamicInput } from './chronix-dynamic-input.js';

describe('ChronixDynamicInput (react)', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the root div with base class and data-testid', () => {
    const { container } = render(<ChronixDynamicInput value={['a', 'b']} />);
    const root = container.querySelector('[data-testid="dynamic-input-root"]');
    expect(root).not.toBeNull();
    expect(root!.classList.contains('cx-ui-dynamic-input')).toBe(true);
  });

  it('mounting ensures the chronix-dynamic-input stylesheet is in document.head', () => {
    render(<ChronixDynamicInput value={[]} />);
    expect(document.head.querySelector('style[data-chronix-ui="dynamic-input"]')).not.toBeNull();
  });
});
