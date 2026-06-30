import { nextTick, ref, watch, type ComputedRef, type Ref } from 'vue';

/**
 * shared menu-keyboard-nav composable —
 * W3C ARIA APG menu/tablist arrow-key navigation extracted into a
 * single per-adapter helper so the 4 chronix-table menu surfaces
 * (tool-panel tablist + -A column header menu +
 * -B cell context menu + column-visibility menu)
 * share identical keyboard semantics. Verbatim port of the vue3
 * composable — Vue 2.7's Composition API has the same `Ref` /
 * `ComputedRef` / `watch` / `nextTick` shape.
 *
 * Decisions ratified in `audit/TABLE_PHASE_84_ARIA_KEYBOARD_NAV_DESIGN.md`:
 *
 * - A.1 — shared composable per adapter (vs 12 inline handlers).
 * - B.1 — index-walk over the items array skipping disabled entries.
 * - C.1 — roving tabindex + imperative `.focus()`.
 */

export interface MenuKeyboardNavItem {
  readonly id: string;
  readonly disabled?: boolean;
}

export interface UseMenuKeyboardNavOptions<T extends MenuKeyboardNavItem> {
  readonly menuRef: Readonly<Ref<HTMLElement | null>>;
  readonly items: ComputedRef<readonly T[]> | Readonly<Ref<readonly T[]>>;
  readonly isOpen: Readonly<Ref<boolean>>;
  readonly orientation?: 'vertical' | 'horizontal';
  /**
   * Optional reactive "menu instance" key. When it changes while the
   * menu is open, activeIndex resets to first enabled. Use for menus
   * where the same `isOpen=true` state hosts logically-different
   * menus over time (e.g., the column header menu cycles between
   * different columns without closing). Most surfaces don't need it.
   */
  readonly instanceKey?: ComputedRef<unknown> | Readonly<Ref<unknown>>;
}

export interface UseMenuKeyboardNavApi {
  readonly activeIndex: Readonly<Ref<number>>;
  handleKeydown(e: KeyboardEvent): void;
}

export function useMenuKeyboardNav<T extends MenuKeyboardNavItem>(
  options: UseMenuKeyboardNavOptions<T>,
): UseMenuKeyboardNavApi {
  const orientation = options.orientation ?? 'vertical';
  const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
  const prevKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';

  const activeIndex = ref<number>(-1);

  function readItems(): readonly T[] {
    return options.items.value;
  }

  function firstEnabledFrom(items: readonly T[], fromIdx: number, direction: 1 | -1): number {
    const n = items.length;
    if (n === 0) return -1;
    let i = ((fromIdx % n) + n) % n;
    for (let step = 0; step < n; step++) {
      const item = items[i];
      if (item != null && item.disabled !== true) return i;
      i = (((i + direction) % n) + n) % n;
    }
    return -1;
  }

  function focusActive(): void {
    const root = options.menuRef.value;
    if (root == null) return;
    const idx = activeIndex.value;
    if (idx < 0) return;
    const el = root.querySelector<HTMLElement>(`[data-menu-item-index="${idx}"]`);
    el?.focus();
  }

  function setActiveIndex(idx: number): void {
    if (idx === activeIndex.value) return;
    activeIndex.value = idx;
    void nextTick(focusActive);
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (!options.isOpen.value) return;
    const items = readItems();
    if (items.length === 0) return;
    const current = activeIndex.value;

    if (e.key === nextKey) {
      const start = current < 0 ? 0 : (current + 1) % items.length;
      const next = firstEnabledFrom(items, start, 1);
      if (next === -1) return;
      e.preventDefault();
      setActiveIndex(next);
    } else if (e.key === prevKey) {
      const start = current < 0 ? items.length - 1 : (current - 1 + items.length) % items.length;
      const next = firstEnabledFrom(items, start, -1);
      if (next === -1) return;
      e.preventDefault();
      setActiveIndex(next);
    } else if (e.key === 'Home') {
      const next = firstEnabledFrom(items, 0, 1);
      if (next === -1) return;
      e.preventDefault();
      setActiveIndex(next);
    } else if (e.key === 'End') {
      const next = firstEnabledFrom(items, items.length - 1, -1);
      if (next === -1) return;
      e.preventDefault();
      setActiveIndex(next);
    }
  }

  watch(
    () => options.isOpen.value,
    (open, prev) => {
      if (open && prev !== true) {
        const items = readItems();
        const first = firstEnabledFrom(items, 0, 1);
        activeIndex.value = first;
        if (first !== -1) {
          void nextTick(focusActive);
        }
      } else if (!open) {
        activeIndex.value = -1;
      }
    },
    { immediate: true },
  );

  watch(
    () => options.items.value,
    (items) => {
      if (!options.isOpen.value) return;
      const n = items.length;
      const current = activeIndex.value;
      if (current >= n) {
        const last = n - 1;
        activeIndex.value = firstEnabledFrom(items, last, -1);
      } else if (current === -1 && n > 0) {
        activeIndex.value = firstEnabledFrom(items, 0, 1);
      }
    },
  );

  if (options.instanceKey != null) {
    watch(
      () => options.instanceKey?.value,
      () => {
        if (!options.isOpen.value) return;
        const items = readItems();
        const first = firstEnabledFrom(items, 0, 1);
        activeIndex.value = first;
        if (first !== -1) {
          void nextTick(focusActive);
        }
      },
    );
  }

  return { activeIndex, handleKeydown };
}
