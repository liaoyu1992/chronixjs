import {
  DEFAULT_HOVER_ENTER_DELAY_MS,
  DEFAULT_HOVER_LEAVE_DELAY_MS,
  defaultPopupSpec,
  nextPopupZIndex,
  resolvePopupPlacement,
  type PopupPlacement,
  type PopupSpec,
  type PopupTrigger,
} from '@chronixjs/ui';
import { computed, nextTick, onBeforeUnmount, ref, watch, type ComputedRef, type Ref } from 'vue';

import { useUIContext } from './use-ui-context.js';

/**
 * Vue 2 popup lifecycle composable. .
 *
 * Differs from `@chronixjs/ui-vue3`'s version in one v0.1.0-alpha
 * tradeoff: the Vue 2 popup is rendered INLINE (no `<Teleport>` —
 * Vue 2 lacks one) as a sibling of the trigger. `position: fixed` on
 * the popup root provides viewport-relative positioning that works
 * for the vast majority of layouts; popups inside ancestors with
 * `transform`/`will-change` may clip incorrectly until v0.2 ships
 * the manual portal sub-component pattern.
 *
 * The `portalTarget` field is omitted from the Vue 2 return shape —
 * adapters render the popup inline next to the trigger.
 */

export interface UsePopupLifecycleArgs {
  readonly show: Ref<boolean | undefined>;
  readonly trigger: Ref<PopupTrigger>;
  readonly placement: Ref<PopupPlacement>;
  readonly offset: Ref<number>;
  readonly flip: Ref<boolean>;
  readonly widthMatch: Ref<boolean>;
  readonly disabled: Ref<boolean>;
  readonly onVisibilityChange: (next: boolean) => void;
}

export interface UsePopupLifecycleReturn {
  readonly triggerRef: Ref<HTMLElement | null>;
  readonly popupRef: Ref<HTMLElement | null>;
  readonly visible: ComputedRef<boolean>;
  readonly actualPlacement: Ref<PopupPlacement>;
  readonly popupStyle: ComputedRef<Record<string, string | number>>;
  readonly triggerHandlers: TriggerHandlers;
  readonly popupHandlers: PopupHandlers;
}

type TriggerHandlers = Record<string, (event?: Event) => void>;

type PopupHandlers = Record<string, (event?: Event) => void>;

export function usePopupLifecycle(args: UsePopupLifecycleArgs): UsePopupLifecycleReturn {
  // ctx is consumed only for parity with vue3 + future portal extension;
  // not directly used in v0.1.0-alpha (inline render).
  useUIContext();

  const internalShow = ref(false);
  const isControlled = computed(() => args.show.value !== undefined);
  const visible = computed(() => (isControlled.value ? !!args.show.value : internalShow.value));

  const triggerRef = ref<HTMLElement | null>(null);
  const popupRef = ref<HTMLElement | null>(null);
  const popupLeft = ref(0);
  const popupTop = ref(0);
  const popupZIndex = ref(1000);
  const actualPlacement = ref<PopupPlacement>(args.placement.value);

  let hoverTimer: ReturnType<typeof setTimeout> | null = null;
  function clearHoverTimer(): void {
    if (hoverTimer !== null) {
      clearTimeout(hoverTimer);
      hoverTimer = null;
    }
  }

  function setVisible(next: boolean): void {
    if (args.disabled.value && next) return;
    if (!isControlled.value) internalShow.value = next;
    args.onVisibilityChange(next);
  }

  function measure(): void {
    if (!triggerRef.value || !popupRef.value) return;
    if (typeof window === 'undefined') return;
    const anchorRect = triggerRef.value.getBoundingClientRect();
    const popupRect = popupRef.value.getBoundingClientRect();
    const viewportRect = {
      left: 0,
      top: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      right: window.innerWidth,
      bottom: window.innerHeight,
    };
    const spec: PopupSpec = {
      placement: args.placement.value,
      offsetPx: args.offset.value,
      flip: args.flip.value,
      widthMatch: args.widthMatch.value,
      viewportPaddingPx: defaultPopupSpec.viewportPaddingPx,
    };
    const result = resolvePopupPlacement({
      anchorRect,
      popupRect,
      viewportRect,
      spec,
    });
    popupLeft.value = result.leftPx;
    popupTop.value = result.topPx;
    actualPlacement.value = result.actualPlacement;
  }

  function onClickOutside(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (!target) return;
    if (triggerRef.value?.contains(target) || popupRef.value?.contains(target)) return;
    setVisible(false);
  }

  function onEscapeKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') setVisible(false);
  }

  watch(visible, (next) => {
    if (next) {
      popupZIndex.value = nextPopupZIndex();
      void nextTick(() => measure());
      if (typeof window !== 'undefined') {
        window.addEventListener('scroll', measure, {
          passive: true,
          capture: true,
        });
        window.addEventListener('resize', measure);
      }
      if (typeof document !== 'undefined') {
        if (args.trigger.value === 'click' || args.trigger.value === 'focus') {
          document.addEventListener('keydown', onEscapeKey);
        }
        if (args.trigger.value === 'click') {
          document.addEventListener('mousedown', onClickOutside);
        }
      }
    } else {
      if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', measure, true);
        window.removeEventListener('resize', measure);
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('keydown', onEscapeKey);
        document.removeEventListener('mousedown', onClickOutside);
      }
    }
  });

  function onTriggerClick(): void {
    if (args.trigger.value === 'click') setVisible(!visible.value);
  }
  function onTriggerMouseEnter(): void {
    if (args.trigger.value === 'hover') {
      clearHoverTimer();
      hoverTimer = setTimeout(() => setVisible(true), DEFAULT_HOVER_ENTER_DELAY_MS);
    }
  }
  function onTriggerMouseLeave(): void {
    if (args.trigger.value === 'hover') {
      clearHoverTimer();
      hoverTimer = setTimeout(() => setVisible(false), DEFAULT_HOVER_LEAVE_DELAY_MS);
    }
  }
  function onTriggerFocusIn(): void {
    if (args.trigger.value === 'focus') setVisible(true);
  }
  function onTriggerFocusOut(): void {
    if (args.trigger.value === 'focus') setVisible(false);
  }
  function onPopupMouseEnter(): void {
    if (args.trigger.value === 'hover') clearHoverTimer();
  }
  function onPopupMouseLeave(): void {
    if (args.trigger.value === 'hover') {
      clearHoverTimer();
      hoverTimer = setTimeout(() => setVisible(false), DEFAULT_HOVER_LEAVE_DELAY_MS);
    }
  }

  onBeforeUnmount(() => {
    clearHoverTimer();
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', onEscapeKey);
      document.removeEventListener('mousedown', onClickOutside);
    }
  });

  const popupStyle = computed<Record<string, string | number>>(() => ({
    position: 'fixed',
    left: `${popupLeft.value}px`,
    top: `${popupTop.value}px`,
    zIndex: popupZIndex.value,
  }));

  return {
    triggerRef,
    popupRef,
    visible,
    actualPlacement,
    popupStyle,
    triggerHandlers: {
      click: onTriggerClick,
      mouseenter: onTriggerMouseEnter,
      mouseleave: onTriggerMouseLeave,
      focusin: onTriggerFocusIn,
      focusout: onTriggerFocusOut,
    },
    popupHandlers: {
      mouseenter: onPopupMouseEnter,
      mouseleave: onPopupMouseLeave,
    },
  };
}
