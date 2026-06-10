import {
  buildHeightCollapseTransitionStyles,
  defaultCollapseTransitionProps,
  ensureChronixCollapseTransitionStyles,
  resolveCollapseTransitionClassList,
} from '@chronixjs/ui';
import { defineComponent, h, nextTick, onMounted, ref, watch } from 'vue';

export const ChronixCollapseTransition = defineComponent({
  name: 'ChronixCollapseTransition',
  props: {
    show: { type: Boolean, default: defaultCollapseTransitionProps.show },
    duration: { type: Number, default: defaultCollapseTransitionProps.duration },
  },
  setup(props, { slots }) {
    ensureChronixCollapseTransitionStyles();
    const wrapperRef = ref<HTMLElement | null>(null);
    const innerStyle = ref<Record<string, string>>(
      props.show ? { overflow: 'hidden' } : { height: '0px', overflow: 'hidden' },
    );

    async function applyShow(next: boolean): Promise<void> {
      const el = wrapperRef.value;
      if (el === null) return;
      await nextTick();
      const scrollHeightPx = el.scrollHeight;
      const phases = buildHeightCollapseTransitionStyles({
        scrollHeightPx,
        spec: {
          durationMs: props.duration,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          delayMs: 0,
        },
      });
      if (next) {
        innerStyle.value = { ...phases.enterFromStyle };
        await nextTick();
        innerStyle.value = { ...phases.enterActiveStyle, ...phases.enterToStyle };
      } else {
        innerStyle.value = { ...phases.leaveFromStyle };
        await nextTick();
        innerStyle.value = { ...phases.leaveActiveStyle, ...phases.leaveToStyle };
      }
    }

    onMounted(() => {
      const el = wrapperRef.value;
      if (el === null) return;
      if (props.show) {
        innerStyle.value = { height: `${el.scrollHeight}px`, overflow: 'hidden' };
      } else {
        innerStyle.value = { height: '0px', overflow: 'hidden' };
      }
    });

    watch(
      () => props.show,
      (next) => {
        void applyShow(next);
      },
    );

    return () =>
      h(
        'div',
        {
          ref: wrapperRef,
          class: resolveCollapseTransitionClassList({ show: props.show }),
          style: innerStyle.value,
        },
        slots['default']?.() ?? [],
      );
  },
});
