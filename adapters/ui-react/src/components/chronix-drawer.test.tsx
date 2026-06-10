import { resetBodyScrollLockForTests, resetPopupZIndexForTests } from '@chronixjs/ui';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ChronixDrawer } from './chronix-drawer.js';

describe('ChronixDrawer (react)', () => {
  beforeEach(() => {
    resetPopupZIndexForTests();
    resetBodyScrollLockForTests();
  });
  afterEach(() => {
    cleanup();
  });

  it('renders null when show=false', () => {
    const { container } = render(<ChronixDrawer show={false}>x</ChronixDrawer>);
    expect(container.firstChild).toBeNull();
    expect(document.querySelector('.cx-ui-drawer')).toBeNull();
  });

  it('portals panel with default --placement-right', () => {
    render(<ChronixDrawer show>body</ChronixDrawer>);
    const panel = document.querySelector('.cx-ui-drawer')!;
    expect(panel.classList.contains('cx-ui-drawer--placement-right')).toBe(true);
  });

  it('applies width via inline style for horizontal placements', () => {
    render(
      <ChronixDrawer show placement="left" width={320}>
        x
      </ChronixDrawer>,
    );
    const panel = document.querySelector<HTMLElement>('.cx-ui-drawer')!;
    expect(panel.style.width).toBe('320px');
  });

  it('applies height via inline style for vertical placements', () => {
    render(
      <ChronixDrawer show placement="top" height={240}>
        x
      </ChronixDrawer>,
    );
    const panel = document.querySelector<HTMLElement>('.cx-ui-drawer')!;
    expect(panel.style.height).toBe('240px');
  });

  it('injects the chronix-drawer stylesheet', () => {
    render(<ChronixDrawer>x</ChronixDrawer>);
    expect(document.head.querySelector('style[data-chronix-ui="drawer"]')).not.toBeNull();
  });
});
