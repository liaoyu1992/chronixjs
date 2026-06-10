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
 * `<ChronixSteps>` — Vue 3 SFC wrapping the core `StepsProps` IR.
 * Phase 20 (2026-06-03). Tier A wizard / multi-stage progress
 * indicator.
 *
 * No emits — per Phase 20 Decision E.1 the per-step click event is
 * out of scope; consumers wire `@click` on the wrapping element if
 * they need navigation.
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
                  'aria-hidden': 'true',
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
              'aria-hidden': 'true',
            }),
          );
        }
      });

      return h('div', { class: classList }, children);
    };
  },
});
