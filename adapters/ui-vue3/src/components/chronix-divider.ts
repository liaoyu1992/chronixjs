import {
  defaultDividerProps,
  ensureChronixDividerStyles,
  resolveDividerClassList,
  type DividerTitlePlacement,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';

/**
 * `<ChronixDivider>` — Vue 3 SFC wrapping the core `DividerProps` IR.
 *
 * . Pure-visual primitive — no
 * `ChronixUIContext` reads (size / disabled don't apply to dividers).
 *
 * Props:
 *
 * - `vertical` (`boolean`) — render as inline vertical bar. Default
 *   `false` (horizontal full-width line).
 * - `titlePlacement` (`'left' | 'center' | 'right'`) — where to place
 *   the title slot along a horizontal divider. Default `'center'`.
 *   Ignored when `vertical: true`.
 * - `dashed` (`boolean`) — render the line as dashed. Default
 *   `false`.
 *
 * Slots:
 *
 * - `default` — title content positioned along the line. When the
 *   slot is empty (or the divider is vertical), no title element is
 *   rendered.
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
      return h('div', { class: classes.value, role: 'separator' }, children);
    };
  },
});
