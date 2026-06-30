import {
  defaultScrollbarProps,
  ensureChronixScrollbarStyles,
  resolveScrollbarClassList,
  type ScrollbarProps,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';

/**
 * `<ChronixScrollbar>` — Vue 2.7 port of the Scrollbar.
 * Verbatim surface mirror of the vue3 sibling; runtime differences are
 * Vue 2's `attrs:` data-object for HTML attributes and `on:` for events.
 * Pure CSS scrollbar with optional JS-driven thumb positioning.
 */
export const ChronixScrollbar = defineComponent({
  name: 'ChronixScrollbar',
  props: {
    trigger: {
      type: String as PropType<'hover' | 'none' | undefined>,
      default: defaultScrollbarProps.trigger,
    },
    xScrollable: {
      type: Boolean,
      default: defaultScrollbarProps.xScrollable,
    },
  },
  setup(props, { slots, attrs }) {
    ensureChronixScrollbarStyles();

    const resolvedProps = computed<ScrollbarProps>(() => ({
      trigger: props.trigger,
      xScrollable: props.xScrollable,
    }));

    return () => {
      const defaultSlot = slots['default'];
      const containerClasses = ['cx-ui-scrollbar__container'];
      if (resolvedProps.value.xScrollable) {
        containerClasses.push('cx-ui-scrollbar__container--x-scrollable');
      }

      const children: VNode[] = [
        h('div', { class: containerClasses }, [...(defaultSlot ? defaultSlot() : [])]),
      ];

      if (resolvedProps.value.trigger !== 'none') {
        children.push(
          h('div', { class: 'cx-ui-scrollbar__rail' }, [
            h('div', { class: 'cx-ui-scrollbar__thumb' }),
          ]),
        );
        if (resolvedProps.value.xScrollable) {
          children.push(
            h('div', { class: 'cx-ui-scrollbar__rail cx-ui-scrollbar__rail--x' }, [
              h('div', { class: 'cx-ui-scrollbar__thumb' }),
            ]),
          );
        }
      }

      return h(
        'div',
        {
          class: resolveScrollbarClassList({ trigger: resolvedProps.value.trigger }),
          attrs: { ...attrs },
        },
        children,
      );
    };
  },
});
