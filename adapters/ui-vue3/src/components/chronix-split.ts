import {
  clampSplitSize,
  defaultSplitProps,
  ensureChronixSplitStyles,
  resolveSplitClassList,
  resolveSplitFirstPaneStyle,
  resolveSplitSizePx,
  type SplitDirection,
} from '@chronixjs/ui';
import { defineComponent, h, onBeforeUnmount, ref, type PropType } from 'vue';

/**
 * `<ChronixSplit>` — Vue 3. . 2-pane resizable
 * splitter with pointer drag. Uses `setPointerCapture` for cross-frame
 * safety (28-fr3).
 */
export const ChronixSplit = defineComponent({
  name: 'ChronixSplit',
  props: {
    direction: {
      type: String as PropType<SplitDirection>,
      default: defaultSplitProps.direction,
    },
    defaultSize: {
      type: [Number, String] as PropType<number | string>,
      default: defaultSplitProps.defaultSize,
    },
    size: {
      type: [Number, String] as PropType<number | string | undefined>,
      default: defaultSplitProps.size,
    },
    minSize: {
      type: [Number, String] as PropType<number | string>,
      default: defaultSplitProps.minSize,
    },
    maxSize: {
      type: [Number, String] as PropType<number | string>,
      default: defaultSplitProps.maxSize,
    },
    disabled: { type: Boolean, default: defaultSplitProps.disabled },
  },
  emits: {
    'update:size': (_size: number | string) => true,
    'resize-start': () => true,
    'resize-end': () => true,
  },
  setup(props, { slots, emit }) {
    ensureChronixSplitStyles();
    const containerRef = ref<HTMLElement | null>(null);
    const internalSize = ref<number | string>(props.defaultSize);
    let activePointerId: number | null = null;
    let activeBar: HTMLElement | null = null;

    function currentSize(): number | string {
      return props.size ?? internalSize.value;
    }

    function containerLengthPx(): number {
      const el = containerRef.value;
      if (el === null) return 0;
      const rect = el.getBoundingClientRect();
      return props.direction === 'horizontal' ? rect.width : rect.height;
    }

    function onPointerDown(event: PointerEvent): void {
      if (props.disabled) return;
      activePointerId = event.pointerId;
      activeBar = event.currentTarget as HTMLElement;
      if (typeof activeBar.setPointerCapture === 'function') {
        try {
          activeBar.setPointerCapture(event.pointerId);
        } catch {
          /* setPointerCapture may throw on detached elements; ignore. */
        }
      }
      emit('resize-start');
      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
      document.addEventListener('pointercancel', onPointerUp);
    }

    function onPointerMove(event: PointerEvent): void {
      if (activePointerId !== event.pointerId) return;
      const el = containerRef.value;
      if (el === null) return;
      const rect = el.getBoundingClientRect();
      const lengthPx = containerLengthPx();
      const proposedPx =
        props.direction === 'horizontal' ? event.clientX - rect.left : event.clientY - rect.top;
      const clamped = clampSplitSize({
        proposedPx,
        minSize: props.minSize,
        maxSize: props.maxSize,
        containerLengthPx: lengthPx,
      });
      const nextSize = `${clamped}px`;
      if (props.size === undefined) internalSize.value = nextSize;
      emit('update:size', nextSize);
    }

    function onPointerUp(event: PointerEvent): void {
      if (activePointerId !== event.pointerId) return;
      if (activeBar !== null && typeof activeBar.releasePointerCapture === 'function') {
        try {
          activeBar.releasePointerCapture(event.pointerId);
        } catch {
          /* releasePointerCapture may throw if already released. */
        }
      }
      activePointerId = null;
      activeBar = null;
      emit('resize-end');
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
    }

    onBeforeUnmount(() => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
    });

    return () => {
      const sizeRaw = currentSize();
      const lengthPx = containerLengthPx();
      const resolvedPx = resolveSplitSizePx({ value: sizeRaw, containerLengthPx: lengthPx });
      const paneStyle = resolveSplitFirstPaneStyle({
        size: resolvedPx ?? sizeRaw,
      });
      const firstSlot = slots['first']?.() ?? [];
      const secondSlot = slots['second']?.() ?? [];
      return h(
        'div',
        {
          ref: containerRef,
          class: resolveSplitClassList({
            direction: props.direction,
            disabled: props.disabled,
          }),
        },
        [
          h(
            'div',
            { class: 'cx-ui-split__pane cx-ui-split__pane--first', style: paneStyle },
            firstSlot,
          ),
          h('div', {
            class: 'cx-ui-split__bar',
            role: 'separator',
            'aria-orientation': props.direction === 'horizontal' ? 'vertical' : 'horizontal',
            tabindex: props.disabled ? '-1' : '0',
            onPointerdown: onPointerDown,
          }),
          h('div', { class: 'cx-ui-split__pane cx-ui-split__pane--second' }, secondSlot),
        ],
      );
    };
  },
});
