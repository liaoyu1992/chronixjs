import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ChronixCollapseTransition } from './chronix-collapse-transition.js';

describe('ChronixCollapseTransition (react)', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the wrapper with base class', () => {
    const { container } = render(
      <ChronixCollapseTransition show={false}>inner</ChronixCollapseTransition>,
    );
    const root = container.querySelector<HTMLElement>('.cx-ui-collapse-transition')!;
    expect(root).not.toBeNull();
    expect(root.style.overflow).toBe('hidden');
  });

  it('adds --expanded class when show=true', () => {
    const { container } = render(<ChronixCollapseTransition show>inner</ChronixCollapseTransition>);
    expect(container.querySelector('.cx-ui-collapse-transition--expanded')).not.toBeNull();
  });

  it('injects the chronix-collapse-transition stylesheet', () => {
    render(<ChronixCollapseTransition show={false}>x</ChronixCollapseTransition>);
    expect(
      document.head.querySelector('style[data-chronix-ui="collapse-transition"]'),
    ).not.toBeNull();
  });
});
