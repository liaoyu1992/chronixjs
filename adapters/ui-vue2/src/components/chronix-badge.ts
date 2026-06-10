import {
  defaultBadgeProps,
  ensureChronixBadgeStyles,
  formatBadgeValue,
  resolveBadgeClassList,
  resolveBadgeSupClassList,
  type BadgeProps,
  type BadgeType,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';

/**
 * `<ChronixBadge>` — Vue 2.7 port of the Phase 14 Badge pilot.
 * Verbatim surface mirror of the vue3 adapter; runtime differences
 * are confined to Vue 2's h() data-object syntax (`class` stays
 * top-level — no `attrs:` needed for `<sup>` since there are no
 * extra HTML attributes).
 */
export const ChronixBadge = defineComponent({
  name: 'ChronixBadge',
  props: {
    value: {
      type: [Number, String] as PropType<number | string | undefined>,
      default: defaultBadgeProps.value,
    },
    max: {
      type: Number as PropType<number | undefined>,
      default: defaultBadgeProps.max,
    },
    dot: {
      type: Boolean,
      default: defaultBadgeProps.dot,
    },
    type: {
      type: String as PropType<BadgeType>,
      default: defaultBadgeProps.type,
    },
    processing: {
      type: Boolean,
      default: defaultBadgeProps.processing,
    },
    show: {
      type: Boolean,
      default: defaultBadgeProps.show,
    },
  },
  setup(props, { slots }) {
    ensureChronixBadgeStyles();

    const resolvedProps = computed<BadgeProps>(() => ({
      value: props.value,
      max: props.max,
      dot: props.dot,
      type: props.type,
      processing: props.processing,
      show: props.show,
    }));

    return () => {
      const defaultSlot = slots['default'];
      const slotNodes: VNode[] = defaultSlot ? defaultSlot() : [];
      const standalone = slotNodes.length === 0;

      const rootClasses = resolveBadgeClassList(resolvedProps.value, standalone);
      const supClasses = resolveBadgeSupClassList(resolvedProps.value);
      const displayValue = resolvedProps.value.dot
        ? ''
        : formatBadgeValue(resolvedProps.value.value, resolvedProps.value.max);

      const sup = h('sup', { class: supClasses }, displayValue);
      const children: VNode[] = standalone ? [sup] : [...slotNodes, sup];
      return h('span', { class: rootClasses }, children);
    };
  },
});
