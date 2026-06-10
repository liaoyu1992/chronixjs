import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixMarquee } from './chronix-marquee.js';

describe('ChronixMarquee (react) — root rendering', () => {
  it('renders a <div> with the base + direction classes', () => {
    const { container } = render(<ChronixMarquee />);
    const root = container.querySelector('div.cx-ui-marquee')!;
    expect(root.tagName).toBe('DIV');
    expect(root.classList.contains('cx-ui-marquee--direction-left')).toBe(true);
  });

  it.each(['left', 'right', 'up', 'down'] as const)(
    'reflects direction="%s" via class modifier',
    (direction) => {
      const { container } = render(<ChronixMarquee direction={direction} />);
      expect(
        container
          .querySelector('div.cx-ui-marquee')!
          .classList.contains(`cx-ui-marquee--direction-${direction}`),
      ).toBe(true);
    },
  );

  it('adds --pause-on-hover modifier when pauseOnHover', () => {
    const { container } = render(<ChronixMarquee pauseOnHover />);
    expect(
      container
        .querySelector('div.cx-ui-marquee')!
        .classList.contains('cx-ui-marquee--pause-on-hover'),
    ).toBe(true);
  });
});

describe('ChronixMarquee (react) — track + duplicated content', () => {
  it('renders a __track child', () => {
    const { container } = render(<ChronixMarquee />);
    expect(container.querySelector('.cx-ui-marquee__track')).not.toBeNull();
  });

  it('renders exactly TWO __copy children inside __track', () => {
    const { container } = render(
      <ChronixMarquee>
        <span>BTC $50,000</span>
      </ChronixMarquee>,
    );
    expect(container.querySelectorAll('.cx-ui-marquee__copy')).toHaveLength(2);
  });

  it('second __copy is aria-hidden for assistive tech', () => {
    const { container } = render(
      <ChronixMarquee>
        <span>tick</span>
      </ChronixMarquee>,
    );
    const copies = container.querySelectorAll('.cx-ui-marquee__copy');
    expect(copies[0]!.getAttribute('aria-hidden')).toBeNull();
    expect(copies[1]!.getAttribute('aria-hidden')).toBe('true');
  });

  it('each __copy carries the children', () => {
    const { container } = render(
      <ChronixMarquee>
        <span data-testid="item">⭐</span>
      </ChronixMarquee>,
    );
    expect(container.querySelectorAll('[data-testid="item"]')).toHaveLength(2);
  });
});

describe('ChronixMarquee (react) — CSS injection', () => {
  it('mounting ensures the chronix-marquee stylesheet is in document.head', () => {
    render(<ChronixMarquee />);
    expect(document.head.querySelector('style[data-chronix-ui="marquee"]')).not.toBeNull();
  });
});
