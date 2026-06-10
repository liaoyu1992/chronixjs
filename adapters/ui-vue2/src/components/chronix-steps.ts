import {
  defaultStepsProps,
  deriveStepItemStatus,
  ensureChronixStepsStyles,
  getStepIndicatorContent,
  resolveStepItemClassList,
  resolveStepsClassList,
  type StepItem,
  type StepsDirection,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';

/**
 * `<ChronixSteps>` — Vue 2.7 port of the Phase 20 Steps.
 *
 * Runtime differences from the vue3 sibling: `h()` second-arg data
 * object uses nested `attrs:` for HTML attributes (`aria-hidden`).
 * DOM shape, class list, status derivation are byte-identical.
 */
export const ChronixSteps = defineComponent({
  name: 'ChronixSteps',
  props: {
    items: {
      type: Array as PropType<readonly StepItem[]>,
      default: (): readonly StepItem[] => defaultStepsProps.items,
    },
    current: {
      type: Number,
      default: defaultStepsProps.current,
    },
    direction: {
      type: String as PropType<StepsDirection>,
      default: defaultStepsProps.direction,
    },
  },
  setup(props) {
    ensureChronixStepsStyles();

    const resolvedProps = computed(() => ({
      items: props.items,
      current: props.current,
      direction: props.direction,
    }));

    return () => {
      const classList = resolveStepsClassList(resolvedProps.value);
      const items = resolvedProps.value.items;
      const current = resolvedProps.value.current;
      const children: VNode[] = [];

      items.forEach((item, idx) => {
        const isLast = idx === items.length - 1;
        const isCurrent = idx === current;
        const derivedStatus = deriveStepItemStatus(item, idx, current);
        const itemClasses = resolveStepItemClassList(derivedStatus, isCurrent);
        const indicatorContent = getStepIndicatorContent(derivedStatus, idx);

        const contentChildren: VNode[] = [h('div', { class: 'cx-ui-steps__title' }, item.title)];
        if (item.description !== undefined) {
          contentChildren.push(h('div', { class: 'cx-ui-steps__description' }, item.description));
        }

        children.push(
          h('div', { key: item.key, class: itemClasses }, [
            h('div', { class: 'cx-ui-steps__indicator' }, [
              h(
                'span',
                {
                  class: 'cx-ui-steps__index',
                  attrs: { 'aria-hidden': 'true' },
                },
                indicatorContent,
              ),
            ]),
            h('div', { class: 'cx-ui-steps__content' }, contentChildren),
          ]),
        );

        if (!isLast) {
          children.push(
            h('div', {
              key: `${item.key}__sep`,
              class: 'cx-ui-steps__separator',
              attrs: { 'aria-hidden': 'true' },
            }),
          );
        }
      });

      return h('div', { class: classList }, children);
    };
  },
});
