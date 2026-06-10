import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixCode } from './chronix-code.js';

describe('ChronixCode (react)', () => {
  it('renders <pre><code> for block mode', () => {
    const { container } = render(<ChronixCode value="foo" />);
    const root = container.querySelector('.cx-ui-code')!;
    expect(root.tagName).toBe('PRE');
    expect(root.querySelector('code')).not.toBeNull();
    expect(root.textContent).toBe('foo');
  });

  it('renders <code> for inline mode', () => {
    const { container } = render(<ChronixCode value="x" inline />);
    const root = container.querySelector('.cx-ui-code')!;
    expect(root.tagName).toBe('CODE');
    expect(root.classList.contains('cx-ui-code--inline')).toBe(true);
  });

  it('injects the stylesheet', () => {
    render(<ChronixCode />);
    expect(document.head.querySelector('style[data-chronix-ui="code"]')).not.toBeNull();
  });
});
