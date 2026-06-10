import {
  defaultDividerProps,
  ensureChronixDividerStyles,
  resolveDividerClassList,
  type DividerTitlePlacement,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';

/**
 * `<ChronixDivider>` — Vue 2.7 port of the Phase 13 Divider pilot.
 * Same DOM shape + class set as the vue3 sibling; runtime differences
 * are Vue 2's nested `attrs:` data-object for `role`.
 */
export const ChronixDivider = defineComponent({
  name: 'ChronixDivider',
  props: {
    vertical: {
      type: Boolean,
      default: defaultDividerProps.vertical,
    },
    titlePlacement: {
      type: String as PropType<DividerTitlePlacement>,
      default: defaultDividerProps.titlePlacement,
    },
    dashed: {
      type: Boolean,
      default: defaultDividerProps.dashed,
    },
  },
  setup(props, { slots }) {
    ensureChronixDividerStyles();

    return () => {
      const defaultSlot = slots['default'];
      const titleNodes: VNode[] = defaultSlot ? defaultSlot() : [];
      const hasTitle = !props.vertical && titleNodes.length > 0;
      const classes = computed(() =>
        resolveDividerClassList(
          {
            vertical: props.vertical,
            titlePlacement: props.titlePlacement,
            dashed: props.dashed,
          },
          hasTitle,
        ),
      );
      const children: VNode[] = [];
      if (hasTitle) {
        children.push(h('span', { class: 'cx-ui-divider__title' }, titleNodes));
      }
      return h('div', { class: classes.value, attrs: { role: 'separator' } }, children);
    };
  },
});
