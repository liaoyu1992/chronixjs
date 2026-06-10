import { defaultWaveProps, ensureChronixWaveStyles, resolveWaveClassList } from '@chronixjs/ui';
import { defineComponent, h, onBeforeUnmount, ref, type PropType } from 'vue';

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
      const data: Record<string, unknown> = {
        class: resolveWaveClassList({
          rippling: rippling.value,
          disabled: props.disabled,
        }),
        on: { pointerdown: onPointerDown },
      };
      if (props.color !== undefined) {
        data['style'] = { '--cx-ui-wave-color': props.color };
      }
      return h('span', data, slots['default']?.() ?? []);
    };
  },
});
