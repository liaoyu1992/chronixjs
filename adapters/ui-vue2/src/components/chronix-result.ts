import {
  defaultResultProps,
  ensureChronixResultStyles,
  RESULT_ICON_BY_STATUS,
  resolveResultClassList,
  type ResultStatus,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';

/**
 * `<ChronixResult>` — Vue 2.7 port of the Phase 18 Result.
 */
export const ChronixResult = defineComponent({
  name: 'ChronixResult',
  props: {
    status: {
      type: String as PropType<ResultStatus>,
      default: defaultResultProps.status,
    },
    title: {
      type: String as PropType<string | undefined>,
      default: defaultResultProps.title,
    },
    description: {
      type: String as PropType<string | undefined>,
      default: defaultResultProps.description,
    },
  },
  setup(props, { slots }) {
    ensureChronixResultStyles();

    const resolvedProps = computed(() => ({
      status: props.status,
      title: props.title,
      description: props.description,
    }));

    return () => {
      const iconSlot = slots['icon'];
      const defaultSlot = slots['default'];
      const extraNodes = defaultSlot ? defaultSlot() : [];
      const hasExtra = extraNodes.length > 0;

      const classList = resolveResultClassList(resolvedProps.value, hasExtra);
      const iconChildren = iconSlot
        ? iconSlot()
        : [RESULT_ICON_BY_STATUS[resolvedProps.value.status]];
      const children: VNode[] = [
        h('div', { class: 'cx-ui-result__icon', attrs: { 'aria-hidden': 'true' } }, iconChildren),
      ];
      if (resolvedProps.value.title !== undefined) {
        children.push(h('div', { class: 'cx-ui-result__title' }, resolvedProps.value.title));
      }
      if (resolvedProps.value.description !== undefined) {
        children.push(
          h('div', { class: 'cx-ui-result__description' }, resolvedProps.value.description),
        );
      }
      if (hasExtra) {
        children.push(h('div', { class: 'cx-ui-result__extra' }, extraNodes));
      }
      return h('div', { class: classList }, children);
    };
  },
});
