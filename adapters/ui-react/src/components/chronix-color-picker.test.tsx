import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixColorPicker } from './chronix-color-picker.js';

describe('ChronixColorPicker (React)', () => {
  it('renders root element with correct class', () => {
    render(<ChronixColorPicker />);
    const root = screen.getByTestId('color-picker-root');
    expect(root).toBeTruthy();
    expect(root.classList.contains('cx-ui-color-picker')).toBe(true);
  });

  it('renders trigger with color preview', () => {
    render(<ChronixColorPicker value="#FF0000" />);
    const trigger = screen.getByTestId('color-picker-trigger');
    expect(trigger).toBeTruthy();
  });

  it('shows panel on trigger click', () => {
    render(<ChronixColorPicker />);
    const trigger = screen.getByTestId('color-picker-trigger');
    trigger.click();
    const panel = screen.getByTestId('color-picker-panel');
    expect(panel).toBeTruthy();
  });

  it('adds disabled class when disabled', () => {
    render(<ChronixColorPicker disabled />);
    const root = screen.getByTestId('color-picker-root');
    expect(root.classList.contains('cx-ui-color-picker--disabled')).toBe(true);
  });
});
