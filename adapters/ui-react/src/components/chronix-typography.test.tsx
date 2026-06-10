import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixTypography } from './chronix-typography.js';

describe('ChronixTypography (react)', () => {
  it('renders <span> + --text for default', () => {
    const { container } = render(<ChronixTypography>hello</ChronixTypography>);
    const root = container.querySelector('.cx-ui-typography')!;
    expect(root.tagName).toBe('SPAN');
    expect(root.classList.contains('cx-ui-typography--text')).toBe(true);
  });

  it('renders <h3> for variant=title level=3', () => {
    const { container } = render(
      <ChronixTypography variant="title" level={3}>
        h3
      </ChronixTypography>,
    );
    const root = container.querySelector('.cx-ui-typography')!;
    expect(root.tagName).toBe('H3');
    expect(root.classList.contains('cx-ui-typography--level-3')).toBe(true);
  });

  it('renders <hr> for variant=hr', () => {
    const { container } = render(<ChronixTypography variant="hr" />);
    expect(container.querySelector('.cx-ui-typography')!.tagName).toBe('HR');
  });

  it('adds --italic + --underline modifiers', () => {
    const { container } = render(
      <ChronixTypography italic underline>
        x
      </ChronixTypography>,
    );
    const root = container.querySelector('.cx-ui-typography')!;
    expect(root.classList.contains('cx-ui-typography--italic')).toBe(true);
    expect(root.classList.contains('cx-ui-typography--underline')).toBe(true);
  });

  it('injects the stylesheet', () => {
    render(<ChronixTypography />);
    expect(document.head.querySelector('style[data-chronix-ui="typography"]')).not.toBeNull();
  });
});
