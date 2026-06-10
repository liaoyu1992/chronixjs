import { resetPopupZIndexForTests } from '@chronixjs/ui';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChronixPopover } from './chronix-popover.js';

describe('ChronixPopover (react)', () => {
  beforeEach(() => {
    resetPopupZIndexForTests();
  });
  afterEach(() => {
    cleanup();
  });

  it('renders trigger span without popup when show=false', () => {
    const { container } = render(
      <ChronixPopover show={false} trigger="manual" content="body">
        <button>trigger</button>
      </ChronixPopover>,
    );
    const trigger = container.querySelector('.cx-ui-popover__trigger')!;
    expect(trigger.tagName).toBe('SPAN');
    expect(document.querySelector('.cx-ui-popover')).toBeNull();
  });

  it('portals popover into document.body when show=true', () => {
    render(
      <ChronixPopover show trigger="manual" content="Popover body">
        <button>trigger</button>
      </ChronixPopover>,
    );
    const popup = document.querySelector('.cx-ui-popover');
    expect(popup).not.toBeNull();
    expect(popup!.classList.contains('cx-ui-popover--open')).toBe(true);
    expect(popup!.textContent).toBe('Popover body');
  });

  it('applies --top-start placement modifier (flip=false to avoid jsdom zero-rect flip)', () => {
    render(
      <ChronixPopover show trigger="manual" placement="top-start" flip={false} content="x">
        <button />
      </ChronixPopover>,
    );
    expect(
      document.querySelector('.cx-ui-popover')!.classList.contains('cx-ui-popover--top-start'),
    ).toBe(true);
  });

  it('injects the chronix-popover stylesheet', () => {
    render(<ChronixPopover>x</ChronixPopover>);
    expect(document.head.querySelector('style[data-chronix-ui="popover"]')).not.toBeNull();
  });

  it('emits onShowChange on trigger click when trigger=click', () => {
    const onShowChange = vi.fn();
    const { container } = render(
      <ChronixPopover trigger="click" content="body" onShowChange={onShowChange}>
        <button>trigger</button>
      </ChronixPopover>,
    );
    fireEvent.click(container.querySelector('.cx-ui-popover__trigger')!);
    expect(onShowChange).toHaveBeenCalledWith(true);
  });
});
