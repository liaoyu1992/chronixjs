import { resetPopupZIndexForTests } from '@chronixjs/ui';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChronixPopconfirm } from './chronix-popconfirm.js';

describe('ChronixPopconfirm (react)', () => {
  beforeEach(() => {
    resetPopupZIndexForTests();
  });
  afterEach(() => {
    cleanup();
  });

  it('renders title + positive/negative buttons when show=true', () => {
    render(
      <ChronixPopconfirm show trigger="manual" title="Delete?" positiveText="Yes" negativeText="No">
        <button>x</button>
      </ChronixPopconfirm>,
    );
    expect(document.querySelector('.cx-ui-popconfirm__title')!.textContent).toBe('Delete?');
    const actions = document.querySelectorAll('.cx-ui-popconfirm__action');
    expect(actions).toHaveLength(2);
    expect(actions[0]!.textContent).toBe('No');
    expect(actions[1]!.textContent).toBe('Yes');
    expect(actions[1]!.classList.contains('cx-ui-popconfirm__action--positive')).toBe(true);
  });

  it('action buttons have type=button', () => {
    render(
      <ChronixPopconfirm show trigger="manual" title="t">
        <button />
      </ChronixPopconfirm>,
    );
    document
      .querySelectorAll('.cx-ui-popconfirm__action')
      .forEach((b) => expect(b.getAttribute('type')).toBe('button'));
  });

  it('emits onPositiveClick + onShowChange(false) on positive click', () => {
    const onPositiveClick = vi.fn();
    const onShowChange = vi.fn();
    render(
      <ChronixPopconfirm
        show
        trigger="manual"
        title="t"
        onPositiveClick={onPositiveClick}
        onShowChange={onShowChange}
      >
        <button />
      </ChronixPopconfirm>,
    );
    const positive = document.querySelector('.cx-ui-popconfirm__action--positive')!;
    fireEvent.click(positive);
    expect(onPositiveClick).toHaveBeenCalledOnce();
    expect(onShowChange).toHaveBeenCalledWith(false);
  });

  it('renders SVG warning icon', () => {
    render(
      <ChronixPopconfirm show trigger="manual" title="t">
        <button />
      </ChronixPopconfirm>,
    );
    expect(document.querySelector('svg.cx-ui-popconfirm__icon')).not.toBeNull();
  });

  it('injects the chronix-popconfirm stylesheet', () => {
    render(<ChronixPopconfirm title="" />);
    expect(document.head.querySelector('style[data-chronix-ui="popconfirm"]')).not.toBeNull();
  });
});
