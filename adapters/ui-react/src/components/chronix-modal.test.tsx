import { resetBodyScrollLockForTests, resetPopupZIndexForTests } from '@chronixjs/ui';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ChronixModal } from './chronix-modal.js';

describe('ChronixModal (react)', () => {
  beforeEach(() => {
    resetPopupZIndexForTests();
    resetBodyScrollLockForTests();
  });
  afterEach(() => {
    cleanup();
  });

  it('renders null when show=false', () => {
    const { container } = render(<ChronixModal show={false}>body</ChronixModal>);
    expect(container.firstChild).toBeNull();
    expect(document.querySelector('.cx-ui-modal')).toBeNull();
  });

  it('portals wrapper + panel into document.body when show=true', () => {
    render(
      <ChronixModal show title="Hello">
        Body content
      </ChronixModal>,
    );
    const wrapper = document.querySelector('.cx-ui-modal-wrapper')!;
    expect(wrapper).not.toBeNull();
    expect(wrapper.classList.contains('cx-ui-modal-wrapper--with-mask')).toBe(true);
    expect(document.querySelector('.cx-ui-modal__title')?.textContent).toBe('Hello');
  });

  it('omits mask when mask=false', () => {
    render(
      <ChronixModal show mask={false}>
        x
      </ChronixModal>,
    );
    expect(document.querySelector('.cx-ui-modal__mask')).toBeNull();
  });

  it('renders footer when provided', () => {
    render(
      <ChronixModal show footer={<span>F</span>}>
        body
      </ChronixModal>,
    );
    expect(document.querySelector('.cx-ui-modal__footer')?.textContent).toContain('F');
  });

  it('applies width via inline style', () => {
    render(
      <ChronixModal show width="640px">
        x
      </ChronixModal>,
    );
    const panel = document.querySelector<HTMLElement>('.cx-ui-modal')!;
    expect(panel.style.width).toBe('640px');
  });

  it('injects the chronix-modal stylesheet', () => {
    render(<ChronixModal>x</ChronixModal>);
    expect(document.head.querySelector('style[data-chronix-ui="modal"]')).not.toBeNull();
  });
});
