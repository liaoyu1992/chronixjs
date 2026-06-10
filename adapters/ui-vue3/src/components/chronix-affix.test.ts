import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';

import { ChronixAffix } from './chronix-affix.js';

describe('ChronixAffix (vue3)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders placeholder + content with base class (not affixed initially in jsdom)', () => {
    const wrapper = mount(ChronixAffix, {
      attachTo: document.body,
      props: { top: 0 },
      slots: { default: () => 'pinned content' },
    });
    expect((wrapper.element as HTMLElement).classList.contains('cx-ui-affix-placeholder')).toBe(
      true,
    );
    const inner = (wrapper.element as HTMLElement).querySelector('.cx-ui-affix');
    expect(inner).not.toBeNull();
    expect(inner!.textContent).toContain('pinned content');
  });

  it('injects the chronix-affix stylesheet', () => {
    mount(ChronixAffix, {
      attachTo: document.body,
      slots: { default: () => 'x' },
    });
    expect(document.head.querySelector('style[data-chronix-ui="affix"]')).not.toBeNull();
  });
});
