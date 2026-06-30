import {
  defaultStatisticProps,
  ensureChronixStatisticStyles,
  formatStatisticValue,
  resolveStatisticClassList,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';

/**
 * `<ChronixStatistic>` — Vue 3 SFC wrapping the core `StatisticProps`
 * IR. . Tier A numeric display.
 *
 * Slots:
 *
 * - `prefix` — optional content rendered before the value (e.g. `$`).
 * - `suffix` — optional content rendered after the value (e.g. `USD`).
 * - default — currently unused.
 */
export const ChronixStatistic = defineComponent({
  name: 'ChronixStatistic',
  props: {
    label: {
      type: String as PropType<string | undefined>,
      default: defaultStatisticProps.label,
    },
    value: {
      type: [Number, String] as PropType<number | string | undefined>,
      default: defaultStatisticProps.value,
    },
    precision: {
      type: Number as PropType<number | undefined>,
      default: defaultStatisticProps.precision,
    },
    tabularNums: {
      type: Boolean,
      default: defaultStatisticProps.tabularNums,
    },
  },
  setup(props, { slots }) {
    ensureChronixStatisticStyles();

    const resolvedProps = computed(() => ({
      label: props.label,
      value: props.value,
      precision: props.precision,
      tabularNums: props.tabularNums,
    }));

    const display = computed(() =>
      formatStatisticValue(resolvedProps.value.value, resolvedProps.value.precision),
    );

    return () => {
      const prefixSlot = slots['prefix'];
      const suffixSlot = slots['suffix'];
      const prefixNodes = prefixSlot ? prefixSlot() : [];
      const suffixNodes = suffixSlot ? suffixSlot() : [];
      const hasPrefix = prefixNodes.length > 0;
      const hasSuffix = suffixNodes.length > 0;

      const classList = resolveStatisticClassList(resolvedProps.value, hasPrefix, hasSuffix);
      const children: VNode[] = [];
      if (resolvedProps.value.label !== undefined) {
        children.push(h('div', { class: 'cx-ui-statistic__label' }, resolvedProps.value.label));
      }
      const contentChildren: VNode[] = [];
      if (hasPrefix) {
        contentChildren.push(h('span', { class: 'cx-ui-statistic__prefix' }, prefixNodes));
      }
      contentChildren.push(h('span', { class: 'cx-ui-statistic__value' }, display.value));
      if (hasSuffix) {
        contentChildren.push(h('span', { class: 'cx-ui-statistic__suffix' }, suffixNodes));
      }
      children.push(h('div', { class: 'cx-ui-statistic__content' }, contentChildren));
      return h('div', { class: classList }, children);
    };
  },
});
