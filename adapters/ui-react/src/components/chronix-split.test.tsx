import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ChronixSplit } from './chronix-split.js';

describe('ChronixSplit (react)', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders 2 panes + 1 bar in horizontal mode by default', () => {
    const { container } = render(<ChronixSplit first="L" second="R" />);
    expect(container.querySelector('.cx-ui-split--direction-horizontal')).not.toBeNull();
    expect(container.querySelector('.cx-ui-split__pane--first')?.textContent).toContain('L');
    expect(container.querySelector('.cx-ui-split__pane--second')?.textContent).toContain('R');
    expect(container.querySelectorAll('.cx-ui-split__bar').length).toBe(1);
  });

  it('vertical direction modifier is applied', () => {
    const { container } = render(<ChronixSplit direction="vertical" first="T" second="B" />);
    expect(container.querySelector('.cx-ui-split--direction-vertical')).not.toBeNull();
  });

  it('bar carries role="separator" + aria-orientation', () => {
    const { container } = render(<ChronixSplit first="a" second="b" />);
    const bar = container.querySelector('.cx-ui-split__bar')!;
    expect(bar.getAttribute('role')).toBe('separator');
    expect(bar.getAttribute('aria-orientation')).toBe('vertical');
  });

  it('disabled prop adds --disabled modifier', () => {
    const { container } = render(<ChronixSplit disabled first="a" second="b" />);
    expect(container.querySelector('.cx-ui-split--disabled')).not.toBeNull();
  });

  it('injects the chronix-split stylesheet', () => {
    render(<ChronixSplit first="a" second="b" />);
    expect(document.head.querySelector('style[data-chronix-ui="split"]')).not.toBeNull();
  });
});
