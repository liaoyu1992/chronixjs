import {
  computeNumberAnimationTween,
  defaultNumberAnimationProps,
  ensureChronixNumberAnimationStyles,
  formatAnimatedNumber,
  resolveNumberAnimationClassList,
} from '@chronixjs/ui';
import { computed, defineComponent, h, onBeforeUnmount, ref } from 'vue';

/**
 * `<ChronixNumberAnimation>` — Vue 3 animated number display.
 * Phase 35 (2026-06-05).
 *
 * Props:
 *
 * - `from` — start value (default 0).
 * - `to` — end value (default 0).
 * - `duration` — animation duration in ms (default 2000).
 * - `precision` — decimal places (default 0).
 * - `active` — whether animation is running (default true).
 * - `showSeparator` — show thousand separators (default false).
 *
 * Uses requestAnimationFrame to tween from `from` to `to` over
 * `duration` milliseconds. Core IR provides the tween math and
 * formatting via `computeNumberAnimationTween` and
 * `formatAnimatedNumber`.
 */
export const ChronixNumberAnimation = defineComponent({
  name: 'ChronixNumberAnimation',
  inheritAttrs: false,
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
  },
  setup(props, { attrs }) {
    ensureChronixNumberAnimationStyles();

    const classList = computed(() => resolveNumberAnimationClassList());

    const displayValue = ref(
      formatAnimatedNumber(
        props.active ? props.from : props.to,
        props.precision,
        props.showSeparator,
      ),
    );

    let rafId: number | null = null;
    let startTime: number | null = null;

    function animate(timestamp: number): void {
      startTime ??= timestamp;

      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / props.duration, 1);

      const tweened = computeNumberAnimationTween(props.from, props.to, progress);
      displayValue.value = formatAnimatedNumber(tweened, props.precision, props.showSeparator);

      if (progress < 1 && props.active) {
        rafId = requestAnimationFrame(animate);
      }
    }

    function startAnimation(): void {
      stopAnimation();
      startTime = null;
      if (props.active && props.from !== props.to) {
        rafId = requestAnimationFrame(animate);
      } else {
        displayValue.value = formatAnimatedNumber(props.to, props.precision, props.showSeparator);
      }
    }

    function stopAnimation(): void {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    // Start animation on mount
    startAnimation();

    onBeforeUnmount(() => {
      stopAnimation();
    });

    return () =>
      h(
        'span',
        {
          class: classList.value,
          'data-testid': 'number-animation-root',
          ...attrs,
        },
        displayValue.value,
      );
  },
});
