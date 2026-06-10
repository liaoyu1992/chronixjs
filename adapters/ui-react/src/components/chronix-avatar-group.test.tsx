import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixAvatarGroup } from './chronix-avatar-group.js';

import type { AvatarItem } from '@chronixjs/ui';

const ITEMS: readonly AvatarItem[] = [
  { key: 'a', src: undefined, text: 'A' },
  { key: 'b', src: undefined, text: 'B' },
  { key: 'c', src: undefined, text: 'C' },
  { key: 'd', src: undefined, text: 'D' },
  { key: 'e', src: undefined, text: 'E' },
  { key: 'f', src: undefined, text: 'F' },
  { key: 'g', src: undefined, text: 'G' },
];

describe('ChronixAvatarGroup (react)', () => {
  it('renders <div> base', () => {
    const { container } = render(<ChronixAvatarGroup items={ITEMS.slice(0, 3)} />);
    const root = container.querySelector('.cx-ui-avatar-group')!;
    expect(root.tagName).toBe('DIV');
  });

  it('renders all avatars when items.length <= max', () => {
    const { container } = render(<ChronixAvatarGroup items={ITEMS.slice(0, 3)} max={5} />);
    expect(container.querySelectorAll('.cx-ui-avatar').length).toBe(3);
    expect(container.querySelector('.cx-ui-avatar-group__overflow')).toBeNull();
  });

  it('renders max-1 + overflow indicator when items.length > max', () => {
    const { container } = render(<ChronixAvatarGroup items={ITEMS} max={5} />);
    expect(container.querySelectorAll('.cx-ui-avatar').length).toBe(5);
    const overflow = container.querySelector('.cx-ui-avatar-group__overflow')!;
    expect(overflow.textContent).toBe('+3');
  });

  it('injects the stylesheet', () => {
    render(<ChronixAvatarGroup />);
    expect(document.head.querySelector('style[data-chronix-ui="avatar-group"]')).not.toBeNull();
  });
});
