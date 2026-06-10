import {
  defaultAnchorProps,
  ensureChronixAnchorStyles,
  resolveAnchorClassList,
  type AnchorItem,
  type AnchorProps,
} from '@chronixjs/ui';
import { computed, defineComponent, h, ref, type VNode } from 'vue';

/**
 * `<ChronixAnchor>` — Vue 3 vertical anchor navigation component.
 * Phase 35 (2026-06-05).
 *
 * Props:
 *
 * - `items` — array of `{ key, label, href }` anchor items.
 * - `showRail` — show the vertical rail indicator (default true).
 * - `showBackground` — show background on active link (default true).
 * - `bound` — offset bound in px for scroll detection (default 12).
 *
 * Clicking a link scrolls to the target element identified by `href`.
 */
export const ChronixAnchor = defineComponent({
  name: 'ChronixAnchor',
  inheritAttrs: false,
  props: {
    items: {
      type: Array as () => readonly AnchorItem[],
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
  setup(props, { attrs }) {
    ensureChronixAnchorStyles();

    const activeKey = ref<string | null>(null);

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
      event.preventDefault();
      activeKey.value = item.key;
      if (typeof document !== 'undefined') {
        const target = document.querySelector(item.href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }

    return () => {
      const linkNodes: VNode[] = props.items.map((item) => {
        const isActive = activeKey.value === item.key;
        const linkClasses = ['cx-ui-anchor__link'];
        if (isActive) {
          linkClasses.push('cx-ui-anchor__link--active');
        }
        return h(
          'a',
          {
            key: item.key,
            class: linkClasses.join(' '),
            href: item.href,
            onClick: (e: MouseEvent) => onLinkClick(item, e),
          },
          item.label,
        );
      });

      return h(
        'nav',
        {
          class: classList.value,
          'data-testid': 'anchor-root',
          ...attrs,
        },
        linkNodes,
      );
    };
  },
});
