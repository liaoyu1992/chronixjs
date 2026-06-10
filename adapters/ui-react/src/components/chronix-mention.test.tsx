import { resetPopupZIndexForTests, type SelectOption } from '@chronixjs/ui';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ChronixMention } from './chronix-mention.js';

const MENTION_OPTS: readonly SelectOption[] = [
  { key: 'alice', label: 'Alice', value: 'alice' },
  { key: 'bob', label: 'Bob', value: 'bob' },
];

describe('ChronixMention (react)', () => {
  beforeEach(() => {
    resetPopupZIndexForTests();
  });
  afterEach(() => {
    cleanup();
  });

  it('renders root with data-testid mention-root', () => {
    render(<ChronixMention options={MENTION_OPTS} />);
    expect(document.querySelector('[data-testid="mention-root"]')).not.toBeNull();
  });

  it('renders textarea', () => {
    render(<ChronixMention options={MENTION_OPTS} />);
    expect(document.querySelector('[data-testid="mention-textarea"]')).not.toBeNull();
  });

  it('injects the chronix-mention stylesheet', () => {
    render(<ChronixMention options={MENTION_OPTS} />);
    expect(document.head.querySelector('style[data-chronix-ui="mention"]')).not.toBeNull();
  });
});
