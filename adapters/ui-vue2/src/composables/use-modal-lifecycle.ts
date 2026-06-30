import {
  getFirstFocusable,
  getLastFocusable,
  lockBodyScroll,
  nextPopupZIndex,
  unlockBodyScroll,
} from '@chronixjs/ui';
import { computed, nextTick, onBeforeUnmount, ref, watch, type ComputedRef, type Ref } from 'vue';

import { useUIContext } from './use-ui-context.js';

/**
 * Vue 2 modal/drawer lifecycle composable — .
 *
 * Differs from `@chronixjs/ui-vue3`'s version in one v0.1.0-alpha
 * tradeoff: the Vue 2 modal/drawer is rendered INLINE (no
 * `<Teleport>` — Vue 2 lacks one) as a sibling of the consumer's
 * `<ChronixModal>` / `<ChronixDrawer>` declaration. The wrapper's
 * `position: fixed; inset: 0` provides viewport coverage that works
 * in the vast majority of layouts; layouts whose ancestor has
 * `transform` / `will-change` / `contain: paint` properties may
 * clip the mask — documented as a known -vue2-fr1
 * tradeoff matching Vue 2 popover handling.
 *
 * The composable surface is otherwise identical to vue3's — Modal +
 * Drawer SFCs consume the same shape across adapters.
 */

export type ModalCloseReason = 'mask' | 'esc' | 'close-button';

export interface UseModalLifecycleArgs {
  readonly show: Ref<boolean | undefined>;
  readonly maskClosable: Ref<boolean>;
  readonly escClosable: Ref<boolean>;
  readonly disabled: Ref<boolean>;
  readonly onVisibilityChange: (next: boolean) => void;
  readonly onClose: (reason: ModalCloseReason) => void;
}

export interface UseModalLifecycleReturn {
  readonly panelRef: Ref<HTMLElement | null>;
  readonly visible: ComputedRef<boolean>;
  readonly wrapperStyle: ComputedRef<Record<string, string | number>>;
  readonly onMaskClick: () => void;
  readonly onCloseButtonClick: () => void;
}

export function useModalLifecycle(args: UseModalLifecycleArgs): UseModalLifecycleReturn {
  // ctx consumed only for parity with vue3 + future portal extension;
  // not directly used in v0.1.0-alpha (inline render).
  useUIContext();

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
    if (event.key === 'Escape' && args.escClosable.value) {
      setVisible(false, 'esc');
    }
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

  const wrapperStyle = computed<Record<string, string | number>>(() => ({
    zIndex: popupZIndex.value,
  }));

  return {
    panelRef,
    visible,
    wrapperStyle,
    onMaskClick,
    onCloseButtonClick,
  };
}
