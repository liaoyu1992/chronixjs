import {
  computeCountdownTickIntervalMs,
  defaultCountdownProps,
  ensureChronixCountdownStyles,
  formatCountdownDuration,
  resolveCountdownClassList,
  type CountdownPrecision,
} from '@chronixjs/ui';
import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type PropType,
  type VNode,
} from 'vue';

/**
 * `<ChronixCountdown>` — Vue 3 SFC wrapping the core `CountdownProps`
 * IR. Phase 18 (2026-06-02). Tier A "live" display with a per-frame
 * ticker.
 *
 * Lifecycle:
 *
 * - `onMounted` → start the timer if `active && duration > 0`.
 * - `watch([active, duration, precision])` → restart from scratch.
 * - `onBeforeUnmount` → clear the interval.
 * - On remaining reaching 0: clear interval + emit `finish`.
 *
 * Emits:
 *
 * - `finish` — fires once when the countdown reaches 0.
 *
 * Slots:
 *
 * - `prefix` / `suffix` — same shape as Statistic.
 */
export const ChronixCountdown = defineComponent({
  name: 'ChronixCountdown',
  props: {
    label: {
      type: String as PropType<string | undefined>,
      default: defaultCountdownProps.label,
    },
    duration: {
      type: Number,
      default: defaultCountdownProps.duration,
    },
    precision: {
      type: Number as PropType<CountdownPrecision>,
      default: defaultCountdownProps.precision,
    },
    active: {
      type: Boolean,
      default: defaultCountdownProps.active,
    },
  },
  emits: {
    finish: () => true,
  },
  setup(props, { slots, emit }) {
    ensureChronixCountdownStyles();

    const remainingMs = ref<number>(props.duration);
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let startedAt = 0;

    function stop() {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }

    function tick() {
      const now = Date.now();
      const next = Math.max(0, props.duration - (now - startedAt));
      remainingMs.value = next;
      if (next <= 0) {
        stop();
        emit('finish');
      }
    }

    function start() {
      stop();
      remainingMs.value = props.duration;
      if (!props.active || props.duration <= 0) return;
      startedAt = Date.now();
      intervalId = setInterval(tick, computeCountdownTickIntervalMs(props.precision));
    }

    onMounted(start);
    onBeforeUnmount(stop);
    watch(() => [props.active, props.duration, props.precision], start);

    const resolvedProps = computed(() => ({
      label: props.label,
      duration: props.duration,
      precision: props.precision,
      active: props.active,
    }));

    const display = computed(() =>
      formatCountdownDuration(remainingMs.value, resolvedProps.value.precision),
    );

    return () => {
      const prefixSlot = slots['prefix'];
      const suffixSlot = slots['suffix'];
      const prefixNodes = prefixSlot ? prefixSlot() : [];
      const suffixNodes = suffixSlot ? suffixSlot() : [];
      const hasPrefix = prefixNodes.length > 0;
      const hasSuffix = suffixNodes.length > 0;

      const classList = resolveCountdownClassList(resolvedProps.value, hasPrefix, hasSuffix);
      const children: VNode[] = [];
      if (resolvedProps.value.label !== undefined) {
        children.push(h('div', { class: 'cx-ui-countdown__label' }, resolvedProps.value.label));
      }
      const contentChildren: VNode[] = [];
      if (hasPrefix) {
        contentChildren.push(h('span', { class: 'cx-ui-countdown__prefix' }, prefixNodes));
      }
      contentChildren.push(h('span', { class: 'cx-ui-countdown__value' }, display.value));
      if (hasSuffix) {
        contentChildren.push(h('span', { class: 'cx-ui-countdown__suffix' }, suffixNodes));
      }
      children.push(h('div', { class: 'cx-ui-countdown__content' }, contentChildren));
      return h('div', { class: classList }, children);
    };
  },
});
