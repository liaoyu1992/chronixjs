import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ChronixFocusDetector } from './chronix-focus-detector.js';

describe('ChronixFocusDetector (react)', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders a span wrapper with base class', () => {
    const { container } = render(<ChronixFocusDetector>inner</ChronixFocusDetector>);
    const root = container.querySelector('.cx-ui-focus-detector')!;
    expect(root).not.toBeNull();
    expect(root.tagName).toBe('SPAN');
  });

  it('adds --disabled modifier when disabled=true', () => {
    const { container } = render(<ChronixFocusDetector disabled>x</ChronixFocusDetector>);
    expect(container.querySelector('.cx-ui-focus-detector--disabled')).not.toBeNull();
  });

  it('injects the chronix-focus-detector stylesheet', () => {
    render(<ChronixFocusDetector>x</ChronixFocusDetector>);
    expect(document.head.querySelector('style[data-chronix-ui="focus-detector"]')).not.toBeNull();
  });
});
