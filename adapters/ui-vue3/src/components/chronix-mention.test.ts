import { resetPopupZIndexForTests, type SelectOption } from '@chronixjs/ui';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ChronixMention } from './chronix-mention.js';

const MENTION_OPTS: readonly SelectOption[] = [
  { key: 'alice', label: 'Alice', value: 'alice' },
  { key: 'bob', label: 'Bob', value: 'bob' },
  { key: 'charlie', label: 'Charlie', value: 'charlie' },
];

describe('ChronixMention (vue3)', () => {
  beforeEach(() => {
    resetPopupZIndexForTests();
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders root with data-testid mention-root', () => {
    const wrapper = mount(ChronixMention, {
      attachTo: document.body,
      props: { options: MENTION_OPTS },
    });
    expect(wrapper.find('[data-testid="mention-root"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('renders textarea with data-testid mention-textarea', () => {
    const wrapper = mount(ChronixMention, {
      attachTo: document.body,
      props: { options: MENTION_OPTS },
    });
    expect(wrapper.find('[data-testid="mention-textarea"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('emits update:value on textarea input', async () => {
    const wrapper = mount(ChronixMention, {
      attachTo: document.body,
      props: { options: MENTION_OPTS },
    });
    const textarea = wrapper.find('[data-testid="mention-textarea"]');
    await textarea.setValue('hello');
    expect(wrapper.emitted('update:value')).toBeTruthy();
    expect(wrapper.emitted('update:value')![0]![0]).toBe('hello');
    wrapper.unmount();
  });

  it('injects the chronix-mention stylesheet', () => {
    const wrapper = mount(ChronixMention, {
      attachTo: document.body,
      props: { options: MENTION_OPTS },
    });
    expect(document.head.querySelector('style[data-chronix-ui="mention"]')).not.toBeNull();
    wrapper.unmount();
  });
});
