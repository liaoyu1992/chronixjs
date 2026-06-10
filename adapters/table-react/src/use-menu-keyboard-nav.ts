import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from 'react';

/**
 * Phase 84 (2026-05-31): shared menu-keyboard-nav hook —
 * W3C ARIA APG menu/tablist arrow-key navigation extracted into a
 * single per-adapter helper so the 4 chronix-table menu surfaces
 * (Phase 80 tool-panel tablist + Phase 83-A column header menu +
 * Phase 83-B cell context menu + Phase 25 column-visibility menu)
 * share identical keyboard semantics. React port of the vue3
 * composable.
 *
 * Decisions ratified in `audit/TABLE_PHASE_84_ARIA_KEYBOARD_NAV_DESIGN.md`:
 *
 * - A.1 — shared hook per adapter (vs 12 inline handlers).
 * - B.1 — index-walk over the items array skipping disabled entries.
 * - C.1 — roving tabindex + imperative `.focus()`.
 *
 * `itemsRef` mirror (Phase 49 ratified pattern) keeps `handleKeydown`
 * stable across renders without stale-closure bugs.
 */

export interface MenuKeyboardNavItem {
  readonly id: string;
  readonly disabled?: boolean;
}

export interface UseMenuKeyboardNavOptions<T extends MenuKeyboardNavItem> {
  readonly menuRef: RefObject<HTMLElement | null>;
  readonly items: readonly T[];
  readonly isOpen: boolean;
  readonly orientation?: 'vertical' | 'horizontal';
  /**
   * Optional "menu instance" key. When it changes while the menu is
   * open, activeIndex resets to first enabled. Use for menus where
   * the same `isOpen=true` state hosts logically-different menus
   * over time (e.g., column header menu cycles between columns).
   * Most surfaces don't need it.
   */
  readonly instanceKey?: unknown;
}

export interface UseMenuKeyboardNavApi {
  readonly activeIndex: number;
  handleKeydown(e: KeyboardEvent | globalThis.KeyboardEvent): void;
}

function firstEnabledFrom<T extends MenuKeyboardNavItem>(
  items: readonly T[],
  fromIdx: number,
  direction: 1 | -1,
): number {
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

export function useMenuKeyboardNav<T extends MenuKeyboardNavItem>(
  options: UseMenuKeyboardNavOptions<T>,
): UseMenuKeyboardNavApi {
  const { menuRef, items, isOpen, orientation = 'vertical', instanceKey } = options;
  const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
  const prevKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';

  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const itemsRef = useRef<readonly T[]>(items);
  itemsRef.current = items;
  const activeIndexRef = useRef<number>(activeIndex);
  activeIndexRef.current = activeIndex;
  const isOpenRef = useRef<boolean>(isOpen);
  isOpenRef.current = isOpen;

  const focusAt = useCallback(
    (idx: number): void => {
      const root = menuRef.current;
      if (root == null) return;
      if (idx < 0) return;
      const el = root.querySelector<HTMLElement>(`[data-menu-item-index="${idx}"]`);
      el?.focus();
    },
    [menuRef],
  );

  const applyIndex = useCallback(
    (idx: number): void => {
      if (idx === activeIndexRef.current) return;
      setActiveIndex(idx);
      // Defer focus until after React reconciles the new tabindex.
      void Promise.resolve().then(() => focusAt(idx));
    },
    [focusAt],
  );

  const handleKeydown = useCallback(
    (e: KeyboardEvent | globalThis.KeyboardEvent): void => {
      if (!isOpenRef.current) return;
      const items = itemsRef.current;
      if (items.length === 0) return;
      const current = activeIndexRef.current;

      if (e.key === nextKey) {
        const start = current < 0 ? 0 : (current + 1) % items.length;
        const next = firstEnabledFrom(items, start, 1);
        if (next === -1) return;
        e.preventDefault();
        applyIndex(next);
      } else if (e.key === prevKey) {
        const start = current < 0 ? items.length - 1 : (current - 1 + items.length) % items.length;
        const next = firstEnabledFrom(items, start, -1);
        if (next === -1) return;
        e.preventDefault();
        applyIndex(next);
      } else if (e.key === 'Home') {
        const next = firstEnabledFrom(items, 0, 1);
        if (next === -1) return;
        e.preventDefault();
        applyIndex(next);
      } else if (e.key === 'End') {
        const next = firstEnabledFrom(items, items.length - 1, -1);
        if (next === -1) return;
        e.preventDefault();
        applyIndex(next);
      }
    },
    [nextKey, prevKey, applyIndex],
  );

  const wasOpenRef = useRef<boolean>(false);
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      const first = firstEnabledFrom(itemsRef.current, 0, 1);
      setActiveIndex(first);
      if (first !== -1) {
        void Promise.resolve().then(() => focusAt(first));
      }
    } else if (!isOpen) {
      setActiveIndex(-1);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, focusAt]);

  useEffect(() => {
    if (!isOpen) return;
    const n = items.length;
    const current = activeIndexRef.current;
    if (current >= n) {
      const last = n - 1;
      setActiveIndex(firstEnabledFrom(items, last, -1));
    } else if (current === -1 && n > 0) {
      setActiveIndex(firstEnabledFrom(items, 0, 1));
    }
  }, [items, isOpen]);

  const prevInstanceKeyRef = useRef<unknown>(instanceKey);
  useEffect(() => {
    if (instanceKey === prevInstanceKeyRef.current) return;
    prevInstanceKeyRef.current = instanceKey;
    if (!isOpenRef.current) return;
    const first = firstEnabledFrom(itemsRef.current, 0, 1);
    setActiveIndex(first);
    if (first !== -1) {
      void Promise.resolve().then(() => focusAt(first));
    }
  }, [instanceKey, focusAt]);

  return { activeIndex, handleKeydown };
}
