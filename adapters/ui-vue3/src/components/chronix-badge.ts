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
 * `<ChronixBadge>` — Vue 3 SFC wrapping the core `BadgeProps` IR.
 *
 * Phase 14 (2026-06-02). First Tier A "wrap-a-child" component:
 * renders an absolutely-positioned `__sup` indicator at the
 * top-right corner of its default slot content, or inline when no
 * child is supplied (standalone mode).
 *
 * Props:
 *
 * - `value` (`number | string | undefined`) — content; `undefined`
 *   renders no visible value (use with `dot` for an indicator-only
 *   badge).
 * - `max` (`number | undefined`) — truncate numeric value above
 *   threshold (`999` + `max=99` → `"99+"`).
 * - `dot` (`boolean`) — render as small filled circle without text.
 * - `type` — `'default' | 'success' | 'warning' | 'error' | 'info'`.
 * - `processing` (`boolean`) — pulse animation.
 * - `show` (`boolean`) — toggle visibility (`false` → hidden via CSS).
 *
 * Slots:
 *
 * - `default` — wrapped child element. When empty, the badge renders
 *   in standalone mode (indicator inline, no positioning).
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
