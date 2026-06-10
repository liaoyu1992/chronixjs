import { resetPopupZIndexForTests, type SelectOption } from '@chronixjs/ui';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ChronixMention } from './chronix-mention.js';

import type { VueConstructor } from 'vue';

const C = ChronixMention as unknown as VueConstructor;

const MENTION_OPTS: readonly SelectOption[] = [
  { key: 'alice', label: 'Alice', value: 'alice' },
  { key: 'bob', label: 'Bob', value: 'bob' },
];

describe('ChronixMention (vue2)', () => {
  beforeEach(() => {
    resetPopupZIndexForTests();
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders root with data-testid mention-root', () => {
    const wrapper = mount(C, {
      attachTo: document.body,
      propsData: { options: MENTION_OPTS },
    });
    expect(wrapper.find('[data-testid="mention-root"]').exists()).toBe(true);
    wrapper.destroy();
  });

  it('renders textarea', () => {
    const wrapper = mount(C, {
      attachTo: document.body,
      propsData: { options: MENTION_OPTS },
    });
    expect(wrapper.find('[data-testid="mention-textarea"]').exists()).toBe(true);
    wrapper.destroy();
  });

  it('injects the chronix-mention stylesheet', () => {
    const wrapper = mount(C, {
      attachTo: document.body,
      propsData: { options: MENTION_OPTS },
    });
    expect(document.head.querySelector('style[data-chronix-ui="mention"]')).not.toBeNull();
    wrapper.destroy();
  });
});
