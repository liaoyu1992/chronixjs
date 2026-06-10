import {
  computeNumberAnimationTween,
  defaultNumberAnimationProps,
  ensureChronixNumberAnimationStyles,
  formatAnimatedNumber,
  resolveNumberAnimationClassList,
} from '@chronixjs/ui';
import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref, type PropType } from 'vue';

/**
 * `<ChronixNumberAnimation>` — Vue 2.7 port of the Phase 35 NumberAnimation.
 * Verbatim surface mirror of the vue3 sibling; runtime differences are
 * Vue 2's `attrs:` data-object for HTML attributes and `on:` for events.
 * Uses requestAnimationFrame in onMounted, cancel in onBeforeUnmount.
 */
export const ChronixNumberAnimation = defineComponent({
  name: 'ChronixNumberAnimation',
  props: {
    from: {
      type: Number,
      default: defaultNumberAnimationProps.from,
    },
    to: {
      type: Number,
      default: defaultNumberAnimationProps.to,
    },
    duration: {
      type: Number,
      default: defaultNumberAnimationProps.duration,
    },
    precision: {
      type: Number,
      default: defaultNumberAnimationProps.precision,
    },
    active: {
      type: Boolean,
      default: defaultNumberAnimationProps.active,
    },
    showSeparator: {
      type: Boolean,
      default: defaultNumberAnimationProps.showSeparator,
    },
    locale: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
  },
  setup(props, { attrs }) {
    ensureChronixNumberAnimationStyles();

    const display = ref(
      formatAnimatedNumber(props.from, props.precision, props.showSeparator ?? false, props.locale),
    );
    let rafId: number | null = null;

    const resolvedProps = computed(() => ({
      from: props.from,
      to: props.to,
      duration: props.duration,
      precision: props.precision,
      active: props.active ?? true,
      showSeparator: props.showSeparator ?? false,
      locale: props.locale,
    }));

    onMounted(() => {
      if (!resolvedProps.value.active) {
        display.value = formatAnimatedNumber(
          resolvedProps.value.from,
          resolvedProps.value.precision,
          resolvedProps.value.showSeparator ?? false,
          resolvedProps.value.locale,
        );
        return;
      }

      const startTime = performance.now();
      const { from, to, duration, precision, showSeparator, locale } = resolvedProps.value;

      function frame(now: number): void {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const tweened = computeNumberAnimationTween(from, to, progress);
        display.value = formatAnimatedNumber(tweened, precision, showSeparator ?? false, locale);
        if (progress < 1) {
          rafId = requestAnimationFrame(frame);
        }
      }

      rafId = requestAnimationFrame(frame);
    });

    onBeforeUnmount(() => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    });

    return () => {
      return h(
        'span',
        { class: resolveNumberAnimationClassList(), attrs: { ...attrs } },
        display.value,
      );
    };
  },
});
