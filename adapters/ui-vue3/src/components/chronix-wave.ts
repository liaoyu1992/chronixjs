import { defaultWaveProps, ensureChronixWaveStyles, resolveWaveClassList } from '@chronixjs/ui';
import { defineComponent, h, onBeforeUnmount, ref, type PropType } from 'vue';

/**
 * `<ChronixWave>` — Vue 3. Phase 29 (2026-06-04). Wraps a child and
 * triggers a CSS ripple animation on `pointerdown`. Adapter manages
 * a boolean `rippling` state cleared by a `setTimeout(duration)`.
 */
export const ChronixWave = defineComponent({
  name: 'ChronixWave',
  props: {
    color: {
      type: String as PropType<string | undefined>,
      default: defaultWaveProps.color,
    },
    duration: { type: Number, default: defaultWaveProps.duration },
    disabled: { type: Boolean, default: defaultWaveProps.disabled },
  },
  setup(props, { slots }) {
    ensureChronixWaveStyles();
    const rippling = ref(false);
    let rippleTimer: ReturnType<typeof setTimeout> | null = null;

    function clearRippleTimer(): void {
      if (rippleTimer !== null) {
        clearTimeout(rippleTimer);
        rippleTimer = null;
      }
    }

    function onPointerDown(): void {
      if (props.disabled) return;
      clearRippleTimer();
      rippling.value = false;
      // Restart animation via off→on flip on next microtask.
      void Promise.resolve().then(() => {
        rippling.value = true;
        rippleTimer = setTimeout(() => {
          rippling.value = false;
          rippleTimer = null;
        }, props.duration);
      });
    }

    onBeforeUnmount(() => clearRippleTimer());

    return () => {
      const style =
        props.color !== undefined ? { ['--cx-ui-wave-color' as const]: props.color } : undefined;
      return h(
        'span',
        {
          class: resolveWaveClassList({
            rippling: rippling.value,
            disabled: props.disabled,
          }),
          style,
          onPointerdown: onPointerDown,
        },
        slots['default']?.() ?? [],
      );
    };
  },
});
