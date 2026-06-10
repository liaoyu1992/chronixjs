import {
  getFirstFocusable,
  getLastFocusable,
  lockBodyScroll,
  nextPopupZIndex,
  unlockBodyScroll,
} from '@chronixjs/ui';
import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  watch,
  type ComputedRef,
  type Ref,
  type StyleValue,
} from 'vue';

import { useUIContext } from './use-ui-context.js';

/**
 * Vue 3 modal/drawer lifecycle composable — Phase 27 (2026-06-03).
 * Shared by `<ChronixModal>` + `<ChronixDrawer>`. Distinct from
 * Phase 26's `usePopupLifecycle` because Modal/Drawer don't have an
 * anchor (no placement math); they pin to the viewport via
 * `position: fixed; inset: 0` and rely on the wrapper's flex
 * centering (Modal) or edge-positioning (Drawer).
 *
 * Concerns wrapped:
 * - Controlled vs uncontrolled `show` state.
 * - `nextPopupZIndex()` per open.
 * - Portal target resolution from `ChronixUIContext.portalContainer`.
 * - Escape close (when `escClosable: true`).
 * - Mask click close (when `maskClosable: true`).
 * - Body scroll lock on open / unlock on close (counter-based,
 *   stack-aware via Phase 27 `lockBodyScroll` / `unlockBodyScroll`).
 * - Focus trap: focus first focusable on open; Tab/Shift+Tab wrap
 *   via document keydown.
 */

export type ModalCloseReason = 'mask' | 'esc' | 'close-button';

export interface UseModalLifecycleArgs {
  readonly show: Ref<boolean | undefined>;
  readonly maskClosable: Ref<boolean>;
  readonly escClosable: Ref<boolean>;
  readonly disabled: Ref<boolean>;
  /** Visibility transition — adapter `emit('update:show', value)`. */
  readonly onVisibilityChange: (next: boolean) => void;
  /** Close intent — adapter `emit('close', reason)`. */
  readonly onClose: (reason: ModalCloseReason) => void;
}

export interface UseModalLifecycleReturn {
  readonly panelRef: Ref<HTMLElement | null>;
  readonly visible: ComputedRef<boolean>;
  readonly wrapperStyle: ComputedRef<StyleValue>;
  readonly portalTarget: ComputedRef<string | HTMLElement>;
  readonly onMaskClick: () => void;
  readonly onCloseButtonClick: () => void;
}

export function useModalLifecycle(args: UseModalLifecycleArgs): UseModalLifecycleReturn {
  const ctx = useUIContext();

  const internalShow = ref(false);
  const isControlled = computed(() => args.show.value !== undefined);
  const visible = computed(() => (isControlled.value ? !!args.show.value : internalShow.value));

  const panelRef = ref<HTMLElement | null>(null);
  const popupZIndex = ref(1000);
  let scrollLocked = false;

  function setVisible(next: boolean, reason: ModalCloseReason | null): void {
    if (args.disabled.value && next) return;
    if (!isControlled.value) internalShow.value = next;
    args.onVisibilityChange(next);
    if (!next && reason !== null) args.onClose(reason);
  }

  function onEscapeKey(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    if (!args.escClosable.value) return;
    setVisible(false, 'esc');
  }

  function onTabKey(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const root = panelRef.value;
    if (root === null) return;
    if (!root.contains(document.activeElement)) return;
    const first = getFirstFocusable(root);
    const last = getLastFocusable(root);
    if (first === null || last === null) return;
    if (event.shiftKey) {
      if (document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  function onKeyDown(event: KeyboardEvent): void {
    onEscapeKey(event);
    onTabKey(event);
  }

  watch(visible, (next) => {
    if (next) {
      popupZIndex.value = nextPopupZIndex();
      lockBodyScroll();
      scrollLocked = true;
      if (typeof document !== 'undefined') {
        document.addEventListener('keydown', onKeyDown);
      }
      void nextTick(() => {
        const root = panelRef.value;
        if (root === null) return;
        const focusTarget = getFirstFocusable(root) ?? root;
        // Panels carry tabindex="-1" so root itself is programmatically focusable.
        focusTarget.focus();
      });
    } else {
      if (scrollLocked) {
        unlockBodyScroll();
        scrollLocked = false;
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('keydown', onKeyDown);
      }
    }
  });

  onBeforeUnmount(() => {
    if (scrollLocked) {
      unlockBodyScroll();
      scrollLocked = false;
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', onKeyDown);
    }
  });

  function onMaskClick(): void {
    if (!args.maskClosable.value) return;
    setVisible(false, 'mask');
  }

  function onCloseButtonClick(): void {
    setVisible(false, 'close-button');
  }

  const wrapperStyle = computed<StyleValue>(() => ({
    zIndex: popupZIndex.value,
  }));

  const portalTarget = computed<string | HTMLElement>(() => {
    const pc = ctx.value.portalContainer;
    if (typeof pc === 'function') {
      const el = pc();
      if (el !== null) return el;
      return 'body';
    }
    return pc;
  });

  return {
    panelRef,
    visible,
    wrapperStyle,
    portalTarget,
    onMaskClick,
    onCloseButtonClick,
  };
}
