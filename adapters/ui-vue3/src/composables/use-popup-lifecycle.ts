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
 * Vue 3 popup lifecycle composable — shared by the 4 components
 * (Popover / Tooltip / Popconfirm / PopSelect) and downstream +
 * popup-bearing components. .
 *
 * Concerns wrapped:
 * - Controlled vs uncontrolled `show` state (consumer prop wins).
 * - Anchor + popup `getBoundingClientRect()` measurement →
 *   `resolvePopupPlacement` → reactive coords + `actualPlacement`.
 * - z-index assignment on open via `nextPopupZIndex`.
 * - Trigger lifecycle: click / hover / focus / manual.
 * - Click outside + Escape close (click / focus triggers).
 * - Scroll / resize re-measurement while open.
 * - Portal target resolution from `ChronixUIContext.portalContainer`.
 */

export interface UsePopupLifecycleArgs {
  readonly show: Ref<boolean | undefined>;
  readonly trigger: Ref<PopupTrigger>;
  readonly placement: Ref<PopupPlacement>;
  readonly offset: Ref<number>;
  readonly flip: Ref<boolean>;
  readonly widthMatch: Ref<boolean>;
  readonly disabled: Ref<boolean>;
  /** Called on every state change so the SFC can `emit('update:show', value)`. */
  readonly onVisibilityChange: (next: boolean) => void;
}

export interface UsePopupLifecycleReturn {
  readonly triggerRef: Ref<HTMLElement | null>;
  readonly popupRef: Ref<HTMLElement | null>;
  readonly visible: ComputedRef<boolean>;
  readonly actualPlacement: Ref<PopupPlacement>;
  readonly popupStyle: ComputedRef<StyleValue>;
  readonly portalTarget: ComputedRef<string | HTMLElement>;
  readonly triggerHandlers: TriggerHandlers;
  readonly popupHandlers: PopupHandlers;
}

interface TriggerHandlers {
  readonly onClick: () => void;
  readonly onMouseenter: () => void;
  readonly onMouseleave: () => void;
  readonly onFocusin: () => void;
  readonly onFocusout: () => void;
}

interface PopupHandlers {
  readonly onMouseenter: () => void;
  readonly onMouseleave: () => void;
}

export function usePopupLifecycle(args: UsePopupLifecycleArgs): UsePopupLifecycleReturn {
  const ctx = useUIContext();

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

  const popupStyle = computed<StyleValue>(() => ({
    left: `${popupLeft.value}px`,
    top: `${popupTop.value}px`,
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
    triggerRef,
    popupRef,
    visible,
    actualPlacement,
    popupStyle,
    portalTarget,
    triggerHandlers: {
      onClick: onTriggerClick,
      onMouseenter: onTriggerMouseEnter,
      onMouseleave: onTriggerMouseLeave,
      onFocusin: onTriggerFocusIn,
      onFocusout: onTriggerFocusOut,
    },
    popupHandlers: {
      onMouseenter: onPopupMouseEnter,
      onMouseleave: onPopupMouseLeave,
    },
  };
}
