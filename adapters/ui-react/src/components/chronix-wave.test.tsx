import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ChronixWave } from './chronix-wave.js';

describe('ChronixWave (react)', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders a wrapper span with base class', () => {
    const { container } = render(<ChronixWave>inner</ChronixWave>);
    const root = container.querySelector('.cx-ui-wave')!;
    expect(root).not.toBeNull();
    expect(root.tagName).toBe('SPAN');
  });

  it('adds --disabled modifier when disabled=true', () => {
    const { container } = render(<ChronixWave disabled>x</ChronixWave>);
    expect(container.querySelector('.cx-ui-wave--disabled')).not.toBeNull();
  });

  it('applies the custom CSS color via inline style', () => {
    const { container } = render(<ChronixWave color="red">x</ChronixWave>);
    const root = container.querySelector<HTMLElement>('.cx-ui-wave')!;
    expect(root.style.getPropertyValue('--cx-ui-wave-color')).toBe('red');
  });

  it('injects the chronix-wave stylesheet', () => {
    render(<ChronixWave>x</ChronixWave>);
    expect(document.head.querySelector('style[data-chronix-ui="wave"]')).not.toBeNull();
  });
});
