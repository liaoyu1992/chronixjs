import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixHighlight } from './chronix-highlight.js';

describe('ChronixHighlight (react)', () => {
  it('renders no <mark> when pattern is empty', () => {
    const { container } = render(<ChronixHighlight value="hello world" />);
    expect(container.querySelectorAll('mark').length).toBe(0);
    expect(container.querySelector('.cx-ui-highlight')!.textContent).toBe('hello world');
  });

  it('wraps matched substring in <mark.cx-ui-highlight__match>', () => {
    const { container } = render(<ChronixHighlight value="foobarbaz" pattern="bar" />);
    const marks = container.querySelectorAll('mark.cx-ui-highlight__match');
    expect(marks.length).toBe(1);
    expect(marks[0]!.textContent).toBe('bar');
  });

  it('respects caseSensitive', () => {
    const { container } = render(
      <ChronixHighlight value="Foo BAR baz" pattern="bar" caseSensitive />,
    );
    expect(container.querySelectorAll('mark').length).toBe(0);
  });

  it('injects the stylesheet', () => {
    render(<ChronixHighlight />);
    expect(document.head.querySelector('style[data-chronix-ui="highlight"]')).not.toBeNull();
  });
});
