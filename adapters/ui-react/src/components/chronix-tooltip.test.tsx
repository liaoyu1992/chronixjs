import { resetPopupZIndexForTests } from '@chronixjs/ui';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ChronixTooltip } from './chronix-tooltip.js';

describe('ChronixTooltip (react)', () => {
  beforeEach(() => {
    resetPopupZIndexForTests();
  });
  afterEach(() => {
    cleanup();
  });

  it('renders trigger span without tooltip when show=false', () => {
    render(
      <ChronixTooltip show={false} trigger="manual" content="hint">
        <button>x</button>
      </ChronixTooltip>,
    );
    expect(document.querySelector('.cx-ui-tooltip')).toBeNull();
  });

  it('portals tooltip with content when show=true', () => {
    render(
      <ChronixTooltip show trigger="manual" content="hint text">
        <button>x</button>
      </ChronixTooltip>,
    );
    const tooltip = document.querySelector('.cx-ui-tooltip');
    expect(tooltip).not.toBeNull();
    expect(tooltip!.textContent).toBe('hint text');
  });

  it('default placement is top (flip=false to avoid jsdom zero-rect flip)', () => {
    render(
      <ChronixTooltip show trigger="manual" flip={false} content="x">
        <button />
      </ChronixTooltip>,
    );
    expect(document.querySelector('.cx-ui-tooltip')!.classList.contains('cx-ui-tooltip--top')).toBe(
      true,
    );
  });

  it('injects the chronix-tooltip stylesheet', () => {
    render(<ChronixTooltip content="" />);
    expect(document.head.querySelector('style[data-chronix-ui="tooltip"]')).not.toBeNull();
  });
});
