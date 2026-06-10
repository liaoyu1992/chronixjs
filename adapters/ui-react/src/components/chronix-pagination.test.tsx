import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixPagination } from './chronix-pagination.js';

describe('ChronixPagination (React)', () => {
  it('renders root element with correct class', () => {
    render(<ChronixPagination pageCount={10} />);
    const root = screen.getByTestId('pagination-root');
    expect(root).toBeTruthy();
    expect(root.classList.contains('cx-ui-pagination')).toBe(true);
  });

  it('renders page buttons for small page counts', () => {
    render(<ChronixPagination pageCount={5} page={1} />);
    expect(screen.getByTestId('pagination-page-1')).toBeTruthy();
    expect(screen.getByTestId('pagination-page-5')).toBeTruthy();
  });

  it('renders prev and next buttons', () => {
    render(<ChronixPagination pageCount={10} page={3} />);
    expect(screen.getByTestId('pagination-prev')).toBeTruthy();
    expect(screen.getByTestId('pagination-next')).toBeTruthy();
  });

  it('adds disabled class when disabled', () => {
    render(<ChronixPagination pageCount={10} disabled />);
    const root = screen.getByTestId('pagination-root');
    expect(root.classList.contains('cx-ui-pagination--disabled')).toBe(true);
  });
});
