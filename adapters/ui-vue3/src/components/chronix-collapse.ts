import {
  defaultCollapseProps,
  ensureChronixCollapseStyles,
  getIcon,
  isCollapseItemExpanded,
  resolveCollapseClassList,
  resolveCollapseItemClassList,
  toggleCollapseValue,
  type CollapseArrowPlacement,
  type CollapseItem,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';

import { ChronixCollapseTransition } from './chronix-collapse-transition.js';

/**
 * `<ChronixCollapse>` — Vue 3. Phase 28 (2026-06-04). Accordion / multi
 * expand panel list. Each item's body is wrapped in
 * `<ChronixCollapseTransition>` for height animation.
 */
export const ChronixCollapse = defineComponent({
  name: 'ChronixCollapse',
  props: {
    value: {
      type: [String, Array] as PropType<string | readonly string[] | undefined>,
      default: defaultCollapseProps.value,
    },
    items: {
      type: Array as PropType<readonly CollapseItem[]>,
      default: () => defaultCollapseProps.items,
    },
    accordion: { type: Boolean, default: defaultCollapseProps.accordion },
    arrowPlacement: {
      type: String as PropType<CollapseArrowPlacement>,
      default: defaultCollapseProps.arrowPlacement,
    },
  },
  emits: {
    'update:value': (_v: string | readonly string[] | undefined) => true,
    'item-change': (_key: string, _expanded: boolean) => true,
  },
  setup(props, { emit }) {
    ensureChronixCollapseStyles();

    const rootClasses = computed(() =>
      resolveCollapseClassList({ arrowPlacement: props.arrowPlacement }),
    );

    function expandedSet(): ReadonlySet<string> {
      if (props.value === undefined) return new Set();
      if (typeof props.value === 'string') return new Set([props.value]);
      return new Set(props.value);
    }

    function toggle(item: CollapseItem): void {
      if (item.disabled) return;
      const currentExpanded = expandedSet();
      const next = toggleCollapseValue({
        currentExpanded,
        toggleKey: item.key,
        accordion: props.accordion,
        items: props.items,
      });
      emit('update:value', next);
      emit('item-change', item.key, !currentExpanded.has(item.key));
    }

    return () => {
      const itemNodes: VNode[] = props.items.map((item) => {
        const expanded = isCollapseItemExpanded({
          value: props.value,
          itemKey: item.key,
        });
        const arrowIcon = getIcon('chevron-right');
        const arrow = arrowIcon
          ? h(
              'svg',
              {
                viewBox: arrowIcon.viewBox,
                width: 14,
                height: 14,
                fill: 'currentColor',
                'aria-hidden': 'true',
              },
              arrowIcon.paths.map((p) =>
                h('path', {
                  d: p.d,
                  ...(p.fillRule !== undefined ? { 'fill-rule': p.fillRule } : {}),
                }),
              ),
            )
          : h('span', '▶');
        return h(
          'div',
          {
            class: resolveCollapseItemClassList({ expanded, disabled: item.disabled }),
            'data-item-key': item.key,
          },
          [
            h(
              'button',
              {
                type: 'button',
                class: 'cx-ui-collapse__header',
                disabled: item.disabled,
                'aria-expanded': expanded ? 'true' : 'false',
                onClick: () => toggle(item),
              },
              [
                h('span', { class: 'cx-ui-collapse__arrow' }, [arrow]),
                h('span', { class: 'cx-ui-collapse__title' }, item.title),
              ],
            ),
            h('div', { class: 'cx-ui-collapse__body' }, [
              h(ChronixCollapseTransition, { show: expanded }, () => [
                h('div', { class: 'cx-ui-collapse__content' }, item.content ?? ''),
              ]),
            ]),
          ],
        );
      });
      return h('div', { class: rootClasses.value, role: 'tablist' }, itemNodes);
    };
  },
});
