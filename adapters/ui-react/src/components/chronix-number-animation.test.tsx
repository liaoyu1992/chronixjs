// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ChronixNumberAnimation } from './chronix-number-animation.js';

describe('ChronixNumberAnimation (react)', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the span with base class and data-testid', () => {
    const { container } = render(<ChronixNumberAnimation from={0} to={100} />);
    const root = container.querySelector('[data-testid="number-animation-root"]');
    expect(root).not.toBeNull();
    expect(root!.tagName).toBe('SPAN');
    expect(root!.classList.contains('cx-ui-number-animation')).toBe(true);
  });

  it('mounting ensures the chronix-number-animation stylesheet is in document.head', () => {
    render(<ChronixNumberAnimation from={0} to={0} />);
    expect(document.head.querySelector('style[data-chronix-ui="number-animation"]')).not.toBeNull();
  });
});
