import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChronixCarousel } from './chronix-carousel.js';

const items = [
  { key: 'a', content: 'A body' },
  { key: 'b', content: 'B body' },
  { key: 'c', content: 'C body' },
] as const;

describe('ChronixCarousel (react)', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders viewport + slides + dots + arrows', () => {
    const { container } = render(<ChronixCarousel items={items} value={0} />);
    expect(container.querySelector('.cx-ui-carousel')).not.toBeNull();
    expect(container.querySelectorAll('.cx-ui-carousel__slide').length).toBe(3);
    expect(container.querySelectorAll('.cx-ui-carousel__dot').length).toBe(3);
    expect(container.querySelectorAll('.cx-ui-carousel__arrow').length).toBe(2);
  });

  it('marks the active slide + dot with --active modifier', () => {
    const { container } = render(<ChronixCarousel items={items} value={1} />);
    expect(
      container
        .querySelector('[data-slide-key="b"]')
        ?.classList.contains('cx-ui-carousel__slide--active'),
    ).toBe(true);
    expect(
      container
        .querySelector('[data-dot-index="1"]')
        ?.classList.contains('cx-ui-carousel__dot--active'),
    ).toBe(true);
  });

  it('emits onValueChange on dot click', () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <ChronixCarousel items={items} value={0} onValueChange={onValueChange} />,
    );
    fireEvent.click(container.querySelector('[data-dot-index="2"]')!);
    expect(onValueChange).toHaveBeenCalledWith(2);
  });

  it('hides dots + arrows when configured', () => {
    const { container } = render(
      <ChronixCarousel items={items} value={0} showDots={false} showArrows={false} />,
    );
    expect(container.querySelector('.cx-ui-carousel__dots')).toBeNull();
    expect(container.querySelector('.cx-ui-carousel__arrows')).toBeNull();
  });

  it('injects the chronix-carousel stylesheet', () => {
    render(<ChronixCarousel items={[]} value={0} />);
    expect(document.head.querySelector('style[data-chronix-ui="carousel"]')).not.toBeNull();
  });
});
