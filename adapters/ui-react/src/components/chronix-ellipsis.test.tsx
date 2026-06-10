import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixEllipsis } from './chronix-ellipsis.js';

describe('ChronixEllipsis (react) — root rendering', () => {
  it('renders a <span> with base + --lines-1 + --with-tooltip', () => {
    const { container } = render(<ChronixEllipsis content="Some text" />);
    const root = container.querySelector('span.cx-ui-ellipsis')!;
    expect(root.tagName).toBe('SPAN');
    expect(root.classList.contains('cx-ui-ellipsis--lines-1')).toBe(true);
    expect(root.classList.contains('cx-ui-ellipsis--with-tooltip')).toBe(true);
  });

  it('renders the content as the inner text', () => {
    const { container } = render(<ChronixEllipsis content="Hello world" />);
    expect(container.querySelector('span.cx-ui-ellipsis')!.textContent).toBe('Hello world');
  });

  it('renders an empty <span> when content is not provided', () => {
    const { container } = render(<ChronixEllipsis />);
    const root = container.querySelector('span.cx-ui-ellipsis')!;
    expect(root.tagName).toBe('SPAN');
    expect(root.textContent).toBe('');
  });
});

describe('ChronixEllipsis (react) — title attribute', () => {
  it('sets title attribute equal to content when tooltip=true (default)', () => {
    const { container } = render(<ChronixEllipsis content="Tooltip text" />);
    expect(container.querySelector('span.cx-ui-ellipsis')!.getAttribute('title')).toBe(
      'Tooltip text',
    );
  });

  it('does not set title attribute when tooltip=false', () => {
    const { container } = render(<ChronixEllipsis content="No tooltip" tooltip={false} />);
    const root = container.querySelector('span.cx-ui-ellipsis')!;
    expect(root.getAttribute('title')).toBeNull();
    expect(root.classList.contains('cx-ui-ellipsis--with-tooltip')).toBe(false);
  });
});

describe('ChronixEllipsis (react) — lineClamp modifier', () => {
  it('emits --lines-2 modifier when lineClamp=2', () => {
    const { container } = render(<ChronixEllipsis content="multi line" lineClamp={2} />);
    const root = container.querySelector('span.cx-ui-ellipsis')!;
    expect(root.classList.contains('cx-ui-ellipsis--lines-2')).toBe(true);
    expect(root.classList.contains('cx-ui-ellipsis--lines-1')).toBe(false);
  });

  it('omits --lines-N when lineClamp is out of [1, 5]', () => {
    const { container } = render(<ChronixEllipsis content="extreme" lineClamp={10} />);
    const classNames = Array.from(container.querySelector('span.cx-ui-ellipsis')!.classList);
    expect(classNames.some((c) => c.startsWith('cx-ui-ellipsis--lines-'))).toBe(false);
  });
});

describe('ChronixEllipsis (react) — CSS injection', () => {
  it('mounting ensures the chronix-ellipsis stylesheet is in document.head', () => {
    render(<ChronixEllipsis content="inject test" />);
    expect(document.head.querySelector('style[data-chronix-ui="ellipsis"]')).not.toBeNull();
  });
});
