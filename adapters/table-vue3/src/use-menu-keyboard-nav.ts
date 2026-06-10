import { nextTick, ref, watch, type ComputedRef, type Ref } from 'vue';

/**
 * Phase 84 (2026-05-31): shared menu-keyboard-nav composable —
 * W3C ARIA APG menu/tablist arrow-key navigation extracted into a
 * single per-adapter helper so the 4 chronix-table menu surfaces
 * (Phase 80 tool-panel tablist + Phase 83-A column header menu +
 * Phase 83-B cell context menu + Phase 25 column-visibility menu)
 * share identical keyboard semantics.
 *
 * Decisions ratified in `audit/TABLE_PHASE_84_ARIA_KEYBOARD_NAV_DESIGN.md`:
 *
 * - A.1 — shared composable per adapter (vs 12 inline handlers).
 * - B.1 — index-walk over the items array skipping disabled entries
 *   (vs render-time filter that would hide them from the DOM).
 * - C.1 — roving tabindex (`tabindex="0"` on active item, `tabindex="-1"`
 *   on others) + imperative `.focus()`; native focus ring announces
 *   the active item to screen readers (vs `aria-activedescendant`).
 *
 * Wiring contract for callers:
 *
 *   const railRef = ref<HTMLElement | null>(null);
 *   const items = computed(() => panels.map(p => ({ id: p.id })));
 *   const nav = useMenuKeyboardNav({
 *     menuRef: railRef,
 *     items,
 *     isOpen: ref(true),
 *   });
 *   // Render: tabindex={nav.activeIndex.value === idx ? 0 : -1},
 *   //         data-menu-item-index={idx}.
 *   // Container: onKeydown={nav.handleKeydown}, ref={railRef}.
 *
 * The composable schedules `.focus()` via `nextTick` after every
 * `activeIndex` change so the DOM has reconciled the new tabindex.
 * The query lookup uses `[data-menu-item-index="N"]` scoped to the
 * menu container — render code must emit that attribute on each
 * focusable item.
 */

export interface MenuKeyboardNavItem {
  readonly id: string;
  readonly disabled?: boolean;
}

export interface UseMenuKeyboardNavOptions<T extends MenuKeyboardNavItem> {
  /** Container element that hosts the items. Queried for `[data-menu-item-index]`. */
  readonly menuRef: Readonly<Ref<HTMLElement | null>>;
  /** Reactive items list. Disabled state read from `item.disabled`. */
  readonly items: ComputedRef<readonly T[]> | Readonly<Ref<readonly T[]>>;
  /** Reactive open flag. When false→true, activeIndex resets to first non-disabled. */
  readonly isOpen: Readonly<Ref<boolean>>;
  /** Default 'vertical' (ArrowDown/Up). 'horizontal' uses ArrowRight/Left. */
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
  /** Index of the item with `tabindex="0"`. -1 when no item is active. */
  readonly activeIndex: Readonly<Ref<number>>;
  /** Bind to the menu container's `onKeydown`. */
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
