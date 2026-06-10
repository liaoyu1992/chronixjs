import {
  defaultFocusDetectorProps,
  ensureChronixFocusDetectorStyles,
  resolveFocusDetectorClassList,
  shouldEmitFocusDetectorEvent,
} from '@chronixjs/ui';
import { defineComponent, h, ref } from 'vue';

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
          on: { focusin: onFocusIn, focusout: onFocusOut },
        },
        slots['default']?.() ?? [],
      );
  },
});
