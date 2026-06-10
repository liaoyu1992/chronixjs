import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ChronixAffix } from './chronix-affix.js';

describe('ChronixAffix (react)', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders placeholder + inner affix content', () => {
    const { container } = render(<ChronixAffix top={0}>pinned content</ChronixAffix>);
    const placeholder = container.firstElementChild as HTMLDivElement;
    expect(placeholder.classList.contains('cx-ui-affix-placeholder')).toBe(true);
    const inner = placeholder.querySelector('.cx-ui-affix');
    expect(inner).not.toBeNull();
    expect(inner!.textContent).toContain('pinned content');
  });

  it('injects the chronix-affix stylesheet', () => {
    render(<ChronixAffix>x</ChronixAffix>);
    expect(document.head.querySelector('style[data-chronix-ui="affix"]')).not.toBeNull();
  });
});
