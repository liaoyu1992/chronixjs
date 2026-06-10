import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ChronixFloatButtonGroup } from './chronix-float-button-group.js';

describe('ChronixFloatButtonGroup (react)', () => {
  afterEach(() => {
    cleanup();
  });

  it('static cluster (no trigger) — no main button, children always visible', () => {
    const { container } = render(<ChronixFloatButtonGroup />);
    const root = container.querySelector('.cx-ui-float-button-group')!;
    expect(root).not.toBeNull();
    expect(root.classList.contains('cx-ui-float-button-group--expanded')).toBe(true);
    expect(root.querySelector('.cx-ui-float-button-group__trigger')).toBeNull();
  });

  it('click trigger adds trigger modifier + collapses by default', () => {
    const { container } = render(<ChronixFloatButtonGroup trigger="click" />);
    const root = container.querySelector('.cx-ui-float-button-group')!;
    expect(root.classList.contains('cx-ui-float-button-group--trigger-click')).toBe(true);
    expect(root.classList.contains('cx-ui-float-button-group--expanded')).toBe(false);
  });

  it('toggles --expanded on main button click', () => {
    const { container } = render(<ChronixFloatButtonGroup trigger="click" />);
    const trigger = container.querySelector('.cx-ui-float-button-group__trigger')!;
    fireEvent.click(trigger);
    expect(
      container
        .querySelector('.cx-ui-float-button-group')
        ?.classList.contains('cx-ui-float-button-group--expanded'),
    ).toBe(true);
  });

  it('square + hover trigger drives modifier', () => {
    const { container } = render(<ChronixFloatButtonGroup shape="square" trigger="hover" />);
    const root = container.querySelector('.cx-ui-float-button-group')!;
    expect(root.classList.contains('cx-ui-float-button-group--shape-square')).toBe(true);
    expect(root.classList.contains('cx-ui-float-button-group--trigger-hover')).toBe(true);
  });

  it('injects the chronix-float-button-group stylesheet', () => {
    render(<ChronixFloatButtonGroup />);
    expect(
      document.head.querySelector('style[data-chronix-ui="float-button-group"]'),
    ).not.toBeNull();
  });
});
