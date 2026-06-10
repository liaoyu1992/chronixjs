// @vitest-environment happy-dom
/// <reference types="vite/client" />
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ChronixForm, ChronixFormItem } from './chronix-form.js';

afterEach(cleanup);

describe('ChronixForm (react)', () => {
  it('renders root <form> element with correct class', () => {
    const { container } = render(<ChronixForm model={{}} />);
    const form = container.querySelector('[data-testid="form-root"]');
    expect(form).not.toBeNull();
    expect(form!.classList.contains('cx-ui-form')).toBe(true);
  });

  it('includes inline modifier when inline prop is true', () => {
    const { container } = render(<ChronixForm model={{}} inline />);
    const form = container.querySelector('[data-testid="form-root"]');
    expect(form!.classList.contains('cx-ui-form--inline')).toBe(true);
  });

  it('includes left-label modifier when labelPlacement is left', () => {
    const { container } = render(<ChronixForm model={{}} labelPlacement="left" />);
    const form = container.querySelector('[data-testid="form-root"]');
    expect(form!.classList.contains('cx-ui-form--left-label')).toBe(true);
  });

  it('injects the chronix-form stylesheet', () => {
    render(<ChronixForm model={{}} />);
    const style = document.head.querySelector('style[data-chronix-ui="form"]');
    expect(style).not.toBeNull();
  });
});

describe('ChronixFormItem (react)', () => {
  it('renders with label and content', () => {
    const { container } = render(
      <ChronixFormItem label="Username" path="username">
        <input data-testid="inner-input" />
      </ChronixFormItem>,
    );
    expect(container.querySelector('[data-testid="form-item"]')).not.toBeNull();
    expect(container.textContent).toContain('Username');
  });

  it('shows required asterisk when rules have required', () => {
    const { container } = render(
      <ChronixFormItem label="Name" path="name" rule={{ required: true, message: 'Required' }} />,
    );
    const asterisk = container.querySelector('.cx-ui-form-item-label__asterisk');
    expect(asterisk).not.toBeNull();
    expect(asterisk!.textContent).toBe('*');
  });

  it('does not show asterisk when not required', () => {
    const { container } = render(<ChronixFormItem label="Optional" path="opt" />);
    const asterisk = container.querySelector('.cx-ui-form-item-label__asterisk');
    expect(asterisk).toBeNull();
  });

  it('renders blank content wrapper', () => {
    const { container } = render(
      <ChronixFormItem label="Test" path="test">
        <input data-testid="inner-input" />
      </ChronixFormItem>,
    );
    const blank = container.querySelector('[data-testid="form-item-blank"]');
    expect(blank).not.toBeNull();
  });
});
