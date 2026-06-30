import { act, renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { describe, expect, it } from 'vitest';

import { useMenuKeyboardNav, type MenuKeyboardNavItem } from './use-menu-keyboard-nav.js';

function items(...ids: readonly string[]): readonly MenuKeyboardNavItem[] {
  return ids.map((id) => ({ id }));
}

function itemsWithDisabled(
  spec: readonly (readonly [string, boolean])[],
): readonly MenuKeyboardNavItem[] {
  return spec.map(([id, disabled]) => ({ id, disabled }));
}

function makeMenuDom(
  itemIds: readonly string[],
  disabledIdx: ReadonlySet<number> = new Set(),
): {
  root: HTMLElement;
  itemEls: readonly HTMLButtonElement[];
} {
  const root = document.createElement('div');
  const itemEls: HTMLButtonElement[] = [];
  for (let i = 0; i < itemIds.length; i++) {
    const btn = document.createElement('button');
    btn.setAttribute('data-menu-item-index', String(i));
    btn.setAttribute('data-menu-item-id', itemIds[i]!);
    if (disabledIdx.has(i)) {
      btn.setAttribute('disabled', '');
    }
    btn.textContent = itemIds[i]!;
    root.appendChild(btn);
    itemEls.push(btn);
  }
  document.body.appendChild(root);
  return { root, itemEls };
}

function key(name: string): KeyboardEvent {
  return new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true });
}

function setupHook(
  itemIds: readonly string[],
  options: {
    readonly isOpen: boolean;
    readonly orientation?: 'vertical' | 'horizontal';
    readonly itemsList?: readonly MenuKeyboardNavItem[];
    readonly disabledIdx?: ReadonlySet<number>;
  },
): {
  readonly hook: ReturnType<typeof renderHook<ReturnType<typeof useMenuKeyboardNav>, unknown>>;
  readonly root: HTMLElement;
  readonly itemEls: readonly HTMLButtonElement[];
} {
  const { root, itemEls } = makeMenuDom(itemIds, options.disabledIdx);
  const fixedItems = options.itemsList ?? items(...itemIds);
  const hook = renderHook(() => {
    const menuRef = useRef<HTMLElement | null>(root);
    return options.orientation == null
      ? useMenuKeyboardNav({
          menuRef,
          items: fixedItems,
          isOpen: options.isOpen,
        })
      : useMenuKeyboardNav({
          menuRef,
          items: fixedItems,
          isOpen: options.isOpen,
          orientation: options.orientation,
        });
  });
  return { hook, root, itemEls };
}

async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

describe('useMenuKeyboardNav (react)', () => {
  it('isOpen: false → handleKeydown is no-op and activeIndex is -1', () => {
    const { hook } = setupHook(['a', 'b', 'c'], { isOpen: false });
    expect(hook.result.current.activeIndex).toBe(-1);
    act(() => hook.result.current.handleKeydown(key('ArrowDown')));
    expect(hook.result.current.activeIndex).toBe(-1);
  });

  it('isOpen: true (mount) → activeIndex resets to first (0)', async () => {
    const { hook } = setupHook(['a', 'b', 'c'], { isOpen: true });
    await flush();
    expect(hook.result.current.activeIndex).toBe(0);
  });

  it('isOpen: true with items[0].disabled → activeIndex resets to first non-disabled', async () => {
    const itemsList = itemsWithDisabled([
      ['a', true],
      ['b', false],
      ['c', false],
    ]);
    const { hook } = setupHook(['a', 'b', 'c'], {
      isOpen: true,
      itemsList,
      disabledIdx: new Set([0]),
    });
    await flush();
    expect(hook.result.current.activeIndex).toBe(1);
  });

  it('ArrowDown advances activeIndex by 1', async () => {
    const { hook } = setupHook(['a', 'b', 'c'], { isOpen: true });
    await flush();
    act(() => hook.result.current.handleKeydown(key('ArrowDown')));
    expect(hook.result.current.activeIndex).toBe(1);
  });

  it('ArrowDown at last index wraps to first', async () => {
    const { hook } = setupHook(['a', 'b', 'c'], { isOpen: true });
    await flush();
    act(() => hook.result.current.handleKeydown(key('ArrowDown')));
    act(() => hook.result.current.handleKeydown(key('ArrowDown')));
    expect(hook.result.current.activeIndex).toBe(2);
    act(() => hook.result.current.handleKeydown(key('ArrowDown')));
    expect(hook.result.current.activeIndex).toBe(0);
  });

  it('ArrowUp retreats activeIndex by 1', async () => {
    const { hook } = setupHook(['a', 'b', 'c'], { isOpen: true });
    await flush();
    act(() => hook.result.current.handleKeydown(key('ArrowDown')));
    act(() => hook.result.current.handleKeydown(key('ArrowDown')));
    expect(hook.result.current.activeIndex).toBe(2);
    act(() => hook.result.current.handleKeydown(key('ArrowUp')));
    expect(hook.result.current.activeIndex).toBe(1);
  });

  it('ArrowUp at first index wraps to last', async () => {
    const { hook } = setupHook(['a', 'b', 'c'], { isOpen: true });
    await flush();
    expect(hook.result.current.activeIndex).toBe(0);
    act(() => hook.result.current.handleKeydown(key('ArrowUp')));
    expect(hook.result.current.activeIndex).toBe(2);
  });

  it('Home jumps to first non-disabled', async () => {
    const itemsList = itemsWithDisabled([
      ['a', true],
      ['b', false],
      ['c', false],
      ['d', false],
    ]);
    const { hook } = setupHook(['a', 'b', 'c', 'd'], {
      isOpen: true,
      itemsList,
      disabledIdx: new Set([0]),
    });
    await flush();
    act(() => hook.result.current.handleKeydown(key('ArrowDown')));
    act(() => hook.result.current.handleKeydown(key('ArrowDown')));
    expect(hook.result.current.activeIndex).toBe(3);
    act(() => hook.result.current.handleKeydown(key('Home')));
    expect(hook.result.current.activeIndex).toBe(1);
  });

  it('End jumps to last non-disabled', async () => {
    const itemsList = itemsWithDisabled([
      ['a', false],
      ['b', false],
      ['c', false],
      ['d', true],
    ]);
    const { hook } = setupHook(['a', 'b', 'c', 'd'], {
      isOpen: true,
      itemsList,
      disabledIdx: new Set([3]),
    });
    await flush();
    act(() => hook.result.current.handleKeydown(key('End')));
    expect(hook.result.current.activeIndex).toBe(2);
  });

  it('ArrowDown skips disabled forward (1 → 3 when 2 disabled)', async () => {
    const itemsList = itemsWithDisabled([
      ['a', false],
      ['b', false],
      ['c', true],
      ['d', false],
    ]);
    const { hook } = setupHook(['a', 'b', 'c', 'd'], {
      isOpen: true,
      itemsList,
      disabledIdx: new Set([2]),
    });
    await flush();
    act(() => hook.result.current.handleKeydown(key('ArrowDown')));
    expect(hook.result.current.activeIndex).toBe(1);
    act(() => hook.result.current.handleKeydown(key('ArrowDown')));
    expect(hook.result.current.activeIndex).toBe(3);
  });

  it('ArrowUp skips disabled backward (3 → 1 when 2 disabled)', async () => {
    const itemsList = itemsWithDisabled([
      ['a', false],
      ['b', false],
      ['c', true],
      ['d', false],
    ]);
    const { hook } = setupHook(['a', 'b', 'c', 'd'], {
      isOpen: true,
      itemsList,
      disabledIdx: new Set([2]),
    });
    await flush();
    act(() => hook.result.current.handleKeydown(key('End')));
    expect(hook.result.current.activeIndex).toBe(3);
    act(() => hook.result.current.handleKeydown(key('ArrowUp')));
    expect(hook.result.current.activeIndex).toBe(1);
  });

  it('all-disabled → handleKeydown is no-op, activeIndex stays at -1', async () => {
    const itemsList = itemsWithDisabled([
      ['a', true],
      ['b', true],
    ]);
    const { hook } = setupHook(['a', 'b'], {
      isOpen: true,
      itemsList,
      disabledIdx: new Set([0, 1]),
    });
    await flush();
    expect(hook.result.current.activeIndex).toBe(-1);
    act(() => hook.result.current.handleKeydown(key('ArrowDown')));
    act(() => hook.result.current.handleKeydown(key('Home')));
    expect(hook.result.current.activeIndex).toBe(-1);
  });

  it("orientation: 'horizontal' uses ArrowRight/ArrowLeft", async () => {
    const { hook } = setupHook(['a', 'b', 'c'], { isOpen: true, orientation: 'horizontal' });
    await flush();
    act(() => hook.result.current.handleKeydown(key('ArrowDown')));
    expect(hook.result.current.activeIndex).toBe(0);
    act(() => hook.result.current.handleKeydown(key('ArrowRight')));
    expect(hook.result.current.activeIndex).toBe(1);
    act(() => hook.result.current.handleKeydown(key('ArrowLeft')));
    expect(hook.result.current.activeIndex).toBe(0);
  });

  it('items change → activeIndex clamps to valid range', async () => {
    const { root } = makeMenuDom(['a', 'b', 'c', 'd', 'e']);
    const initialItems = items('a', 'b', 'c', 'd', 'e');
    const hook = renderHook(
      ({ list }: { list: readonly MenuKeyboardNavItem[] }) => {
        const menuRef = useRef<HTMLElement | null>(root);
        return useMenuKeyboardNav({ menuRef, items: list, isOpen: true });
      },
      { initialProps: { list: initialItems } },
    );
    await flush();
    act(() => hook.result.current.handleKeydown(key('End')));
    expect(hook.result.current.activeIndex).toBe(4);
    hook.rerender({ list: items('a', 'b', 'c') });
    await flush();
    expect(hook.result.current.activeIndex).toBe(2);
  });

  it('focus shifts to the active item after ArrowDown', async () => {
    const { hook, itemEls } = setupHook(['a', 'b', 'c'], { isOpen: true });
    await flush();
    act(() => hook.result.current.handleKeydown(key('ArrowDown')));
    await flush();
    expect(document.activeElement).toBe(itemEls[1]);
  });
});
