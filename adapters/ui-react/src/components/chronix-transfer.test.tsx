import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixTransfer } from './chronix-transfer.js';

const OPTIONS = [
  { label: 'Apple', value: 'a' },
  { label: 'Banana', value: 'b' },
  { label: 'Cherry', value: 'c' },
];

describe('ChronixTransfer (React)', () => {
  it('renders root element with correct class', () => {
    render(<ChronixTransfer options={OPTIONS} />);
    const root = screen.getByTestId('transfer-root');
    expect(root).toBeTruthy();
    expect(root.classList.contains('cx-ui-transfer')).toBe(true);
  });

  it('renders source and target panels', () => {
    render(<ChronixTransfer options={OPTIONS} />);
    expect(screen.getByTestId('transfer-source')).toBeTruthy();
    expect(screen.getByTestId('transfer-target')).toBeTruthy();
  });

  it('renders items in source panel', () => {
    render(<ChronixTransfer options={OPTIONS} />);
    expect(screen.getByTestId('transfer-source-a')).toBeTruthy();
  });

  it('adds disabled class when disabled', () => {
    render(<ChronixTransfer options={OPTIONS} disabled />);
    const root = screen.getByTestId('transfer-root');
    expect(root.classList.contains('cx-ui-transfer--disabled')).toBe(true);
  });
});
