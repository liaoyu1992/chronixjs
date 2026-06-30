import {
  defaultAnchorProps,
  ensureChronixAnchorStyles,
  resolveAnchorClassList,
  type AnchorItem,
  type AnchorProps,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';

/**
 * `<ChronixAnchor>` — Vue 2.7 port of the Anchor.
 * Verbatim surface mirror of the vue3 sibling; runtime differences are
 * Vue 2's `attrs:` data-object for HTML attributes and `on:` for events.
 */
export const ChronixAnchor = defineComponent({
  name: 'ChronixAnchor',
  props: {
    items: {
      type: Array as PropType<readonly AnchorItem[]>,
      default: () => defaultAnchorProps.items,
    },
    showRail: {
      type: Boolean,
      default: defaultAnchorProps.showRail,
    },
    showBackground: {
      type: Boolean,
      default: defaultAnchorProps.showBackground,
    },
    bound: {
      type: Number,
      default: defaultAnchorProps.bound,
    },
  },
  emits: {
    click: (_key: string, _event: MouseEvent) => true,
  },
  setup(props, { emit, attrs }) {
    ensureChronixAnchorStyles();

    const resolvedProps = computed<AnchorProps>(() => ({
      items: props.items,
      showRail: props.showRail,
      showBackground: props.showBackground,
      bound: props.bound,
    }));

    const classList = computed(() =>
      resolveAnchorClassList({
        showRail: resolvedProps.value.showRail,
        showBackground: resolvedProps.value.showBackground,
      }),
    );

    function onLinkClick(item: AnchorItem, event: MouseEvent): void {
      emit('click', item.key, event);
    }

    return () => {
      const children: VNode[] = [];
      for (const item of resolvedProps.value.items) {
        children.push(
          h(
            'a',
            {
              class: 'cx-ui-anchor__link',
              attrs: {
                href: item.href,
                'data-anchor-key': item.key,
              },
              on: { click: (e: MouseEvent) => onLinkClick(item, e) },
            },
            item.label,
          ),
        );
      }
      return h('div', { class: classList.value, attrs: { ...attrs } }, children);
    };
  },
});
