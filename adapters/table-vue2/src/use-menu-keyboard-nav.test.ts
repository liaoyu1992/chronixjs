import { describe, expect, it } from 'vitest';
import { computed, nextTick, ref } from 'vue';

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

describe('useMenuKeyboardNav (Phase 84 — vue2)', () => {
  it('isOpen: false → handleKeydown is no-op and activeIndex is -1', async () => {
    const { root } = makeMenuDom(['a', 'b', 'c']);
    const menuRef = ref<HTMLElement | null>(root);
    const isOpen = ref(false);
    const nav = useMenuKeyboardNav({ menuRef, items: ref(items('a', 'b', 'c')), isOpen });
    await nextTick();
    expect(nav.activeIndex.value).toBe(-1);
    nav.handleKeydown(key('ArrowDown'));
    expect(nav.activeIndex.value).toBe(-1);
  });

  it('isOpen transitions false → true → activeIndex resets to first (0)', async () => {
    const { root } = makeMenuDom(['a', 'b', 'c']);
    const menuRef = ref<HTMLElement | null>(root);
    const isOpen = ref(false);
    const nav = useMenuKeyboardNav({ menuRef, items: ref(items('a', 'b', 'c')), isOpen });
    await nextTick();
    isOpen.value = true;
    await nextTick();
    expect(nav.activeIndex.value).toBe(0);
  });

  it('isOpen open with items[0].disabled → activeIndex resets to first non-disabled', async () => {
    const { root } = makeMenuDom(['a', 'b', 'c'], new Set([0]));
    const menuRef = ref<HTMLElement | null>(root);
    const isOpen = ref(false);
    const nav = useMenuKeyboardNav({
      menuRef,
      items: ref(
        itemsWithDisabled([
          ['a', true],
          ['b', false],
          ['c', false],
        ]),
      ),
      isOpen,
    });
    isOpen.value = true;
    await nextTick();
    expect(nav.activeIndex.value).toBe(1);
  });

  it('ArrowDown advances activeIndex by 1', async () => {
    const { root } = makeMenuDom(['a', 'b', 'c']);
    const menuRef = ref<HTMLElement | null>(root);
    const isOpen = ref(true);
    const nav = useMenuKeyboardNav({ menuRef, items: ref(items('a', 'b', 'c')), isOpen });
    await nextTick();
    nav.handleKeydown(key('ArrowDown'));
    await nextTick();
    expect(nav.activeIndex.value).toBe(1);
  });

  it('ArrowDown at last index wraps to first', async () => {
    const { root } = makeMenuDom(['a', 'b', 'c']);
    const menuRef = ref<HTMLElement | null>(root);
    const isOpen = ref(true);
    const nav = useMenuKeyboardNav({ menuRef, items: ref(items('a', 'b', 'c')), isOpen });
    await nextTick();
    nav.handleKeydown(key('ArrowDown'));
    nav.handleKeydown(key('ArrowDown'));
    await nextTick();
    expect(nav.activeIndex.value).toBe(2);
    nav.handleKeydown(key('ArrowDown'));
    await nextTick();
    expect(nav.activeIndex.value).toBe(0);
  });

  it('ArrowUp retreats activeIndex by 1', async () => {
    const { root } = makeMenuDom(['a', 'b', 'c']);
    const menuRef = ref<HTMLElement | null>(root);
    const isOpen = ref(true);
    const nav = useMenuKeyboardNav({ menuRef, items: ref(items('a', 'b', 'c')), isOpen });
    await nextTick();
    nav.handleKeydown(key('ArrowDown'));
    nav.handleKeydown(key('ArrowDown'));
    await nextTick();
    expect(nav.activeIndex.value).toBe(2);
    nav.handleKeydown(key('ArrowUp'));
    await nextTick();
    expect(nav.activeIndex.value).toBe(1);
  });

  it('ArrowUp at first index wraps to last', async () => {
    const { root } = makeMenuDom(['a', 'b', 'c']);
    const menuRef = ref<HTMLElement | null>(root);
    const isOpen = ref(true);
    const nav = useMenuKeyboardNav({ menuRef, items: ref(items('a', 'b', 'c')), isOpen });
    await nextTick();
    expect(nav.activeIndex.value).toBe(0);
    nav.handleKeydown(key('ArrowUp'));
    await nextTick();
    expect(nav.activeIndex.value).toBe(2);
  });

  it('Home jumps to first non-disabled', async () => {
    const { root } = makeMenuDom(['a', 'b', 'c', 'd'], new Set([0]));
    const menuRef = ref<HTMLElement | null>(root);
    const isOpen = ref(true);
    const nav = useMenuKeyboardNav({
      menuRef,
      items: ref(
        itemsWithDisabled([
          ['a', true],
          ['b', false],
          ['c', false],
          ['d', false],
        ]),
      ),
      isOpen,
    });
    await nextTick();
    nav.handleKeydown(key('ArrowDown'));
    nav.handleKeydown(key('ArrowDown'));
    await nextTick();
    expect(nav.activeIndex.value).toBe(3);
    nav.handleKeydown(key('Home'));
    await nextTick();
    expect(nav.activeIndex.value).toBe(1);
  });

  it('End jumps to last non-disabled', async () => {
    const { root } = makeMenuDom(['a', 'b', 'c', 'd'], new Set([3]));
    const menuRef = ref<HTMLElement | null>(root);
    const isOpen = ref(true);
    const nav = useMenuKeyboardNav({
      menuRef,
      items: ref(
        itemsWithDisabled([
          ['a', false],
          ['b', false],
          ['c', false],
          ['d', true],
        ]),
      ),
      isOpen,
    });
    await nextTick();
    nav.handleKeydown(key('End'));
    await nextTick();
    expect(nav.activeIndex.value).toBe(2);
  });

  it('ArrowDown skips disabled forward (1 → 3 when 2 disabled)', async () => {
    const { root } = makeMenuDom(['a', 'b', 'c', 'd'], new Set([2]));
    const menuRef = ref<HTMLElement | null>(root);
    const isOpen = ref(true);
    const nav = useMenuKeyboardNav({
      menuRef,
      items: ref(
        itemsWithDisabled([
          ['a', false],
          ['b', false],
          ['c', true],
          ['d', false],
        ]),
      ),
      isOpen,
    });
    await nextTick();
    nav.handleKeydown(key('ArrowDown'));
    await nextTick();
    expect(nav.activeIndex.value).toBe(1);
    nav.handleKeydown(key('ArrowDown'));
    await nextTick();
    expect(nav.activeIndex.value).toBe(3);
  });

  it('ArrowUp skips disabled backward (3 → 1 when 2 disabled)', async () => {
    const { root } = makeMenuDom(['a', 'b', 'c', 'd'], new Set([2]));
    const menuRef = ref<HTMLElement | null>(root);
    const isOpen = ref(true);
    const nav = useMenuKeyboardNav({
      menuRef,
      items: ref(
        itemsWithDisabled([
          ['a', false],
          ['b', false],
          ['c', true],
          ['d', false],
        ]),
      ),
      isOpen,
    });
    await nextTick();
    nav.handleKeydown(key('End'));
    await nextTick();
    expect(nav.activeIndex.value).toBe(3);
    nav.handleKeydown(key('ArrowUp'));
    await nextTick();
    expect(nav.activeIndex.value).toBe(1);
  });

  it('all-disabled → handleKeydown is no-op, activeIndex stays at -1', async () => {
    const { root } = makeMenuDom(['a', 'b'], new Set([0, 1]));
    const menuRef = ref<HTMLElement | null>(root);
    const isOpen = ref(true);
    const nav = useMenuKeyboardNav({
      menuRef,
      items: ref(
        itemsWithDisabled([
          ['a', true],
          ['b', true],
        ]),
      ),
      isOpen,
    });
    await nextTick();
    expect(nav.activeIndex.value).toBe(-1);
    nav.handleKeydown(key('ArrowDown'));
    nav.handleKeydown(key('Home'));
    await nextTick();
    expect(nav.activeIndex.value).toBe(-1);
  });

  it("orientation: 'horizontal' uses ArrowRight/ArrowLeft", async () => {
    const { root } = makeMenuDom(['a', 'b', 'c']);
    const menuRef = ref<HTMLElement | null>(root);
    const isOpen = ref(true);
    const nav = useMenuKeyboardNav({
      menuRef,
      items: ref(items('a', 'b', 'c')),
      isOpen,
      orientation: 'horizontal',
    });
    await nextTick();
    nav.handleKeydown(key('ArrowDown'));
    await nextTick();
    expect(nav.activeIndex.value).toBe(0);
    nav.handleKeydown(key('ArrowRight'));
    await nextTick();
    expect(nav.activeIndex.value).toBe(1);
    nav.handleKeydown(key('ArrowLeft'));
    await nextTick();
    expect(nav.activeIndex.value).toBe(0);
  });

  it('items change → activeIndex clamps to valid range', async () => {
    const { root } = makeMenuDom(['a', 'b', 'c', 'd', 'e']);
    const menuRef = ref<HTMLElement | null>(root);
    const isOpen = ref(true);
    const itemsRef = ref<readonly MenuKeyboardNavItem[]>(items('a', 'b', 'c', 'd', 'e'));
    const nav = useMenuKeyboardNav({
      menuRef,
      items: computed(() => itemsRef.value),
      isOpen,
    });
    await nextTick();
    nav.handleKeydown(key('End'));
    await nextTick();
    expect(nav.activeIndex.value).toBe(4);
    itemsRef.value = items('a', 'b', 'c');
    await nextTick();
    expect(nav.activeIndex.value).toBe(2);
  });

  it('focus shifts to the active item after ArrowDown', async () => {
    const { root, itemEls } = makeMenuDom(['a', 'b', 'c']);
    const menuRef = ref<HTMLElement | null>(root);
    const isOpen = ref(true);
    const nav = useMenuKeyboardNav({ menuRef, items: ref(items('a', 'b', 'c')), isOpen });
    await nextTick();
    await nextTick();
    nav.handleKeydown(key('ArrowDown'));
    await nextTick();
    expect(document.activeElement).toBe(itemEls[1]);
  });
});
