import {
  defaultFocusDetectorProps,
  ensureChronixFocusDetectorStyles,
  resolveFocusDetectorClassList,
  shouldEmitFocusDetectorEvent,
} from '@chronixjs/ui';
import { defineComponent, h, ref } from 'vue';

/**
 * `<ChronixFocusDetector>` — Vue 3. Phase 29 (2026-06-04). Transparent
 * wrapper that emits `focus(event)` when focus enters the wrapper from
 * outside, and `blur(event)` when focus leaves entirely. Uses bubbling
 * `focusin` / `focusout` events with `relatedTarget` boundary check.
 */
export const ChronixFocusDetector = defineComponent({
  name: 'ChronixFocusDetector',
  props: {
    disabled: { type: Boolean, default: defaultFocusDetectorProps.disabled },
  },
  emits: {
    focus: (_event: FocusEvent) => true,
    blur: (_event: FocusEvent) => true,
  },
  setup(props, { slots, emit }) {
    ensureChronixFocusDetectorStyles();
    const wrapperRef = ref<HTMLElement | null>(null);

    function onFocusIn(event: FocusEvent): void {
      if (props.disabled) return;
      const wrapper = wrapperRef.value;
      if (wrapper === null) return;
      if (
        shouldEmitFocusDetectorEvent({
          currentTarget: wrapper,
          relatedTarget: event.relatedTarget as HTMLElement | null,
        })
      ) {
        emit('focus', event);
      }
    }

    function onFocusOut(event: FocusEvent): void {
      if (props.disabled) return;
      const wrapper = wrapperRef.value;
      if (wrapper === null) return;
      if (
        shouldEmitFocusDetectorEvent({
          currentTarget: wrapper,
          relatedTarget: event.relatedTarget as HTMLElement | null,
        })
      ) {
        emit('blur', event);
      }
    }

    return () =>
      h(
        'span',
        {
          ref: wrapperRef,
          class: resolveFocusDetectorClassList({ disabled: props.disabled }),
          onFocusin: onFocusIn,
          onFocusout: onFocusOut,
        },
        slots['default']?.() ?? [],
      );
  },
});
