import {
  defaultEllipsisProps,
  ensureChronixEllipsisStyles,
  resolveEllipsisClassList,
} from '@chronixjs/ui';
import { computed, defineComponent, h } from 'vue';

/**
 * `<ChronixEllipsis>` — Vue 2.7 port of the Phase 23 Ellipsis.
 *
 * Root element is `<span>` (NOT `<div>`) — 23-fr2: inline element
 * so it composes within inline flows.
 *
 * Runtime difference from vue3 sibling: the native HTML `title`
 * attribute lives under the `h()` data object's nested `attrs:`
 * bag. Vue 2 also strips `undefined` attrs so the helper flips
 * cleanly between `tooltip=true` and `tooltip=false`.
 */
export const ChronixEllipsis = defineComponent({
  name: 'ChronixEllipsis',
  props: {
    content: {
      type: String,
      default: defaultEllipsisProps.content,
    },
    tooltip: {
      type: Boolean,
      default: defaultEllipsisProps.tooltip,
    },
    lineClamp: {
      type: Number,
      default: defaultEllipsisProps.lineClamp,
    },
  },
  setup(props) {
    ensureChronixEllipsisStyles();

    const resolvedProps = computed(() => ({
      content: props.content,
      tooltip: props.tooltip,
      lineClamp: props.lineClamp,
    }));

    return () => {
      const classList = resolveEllipsisClassList(resolvedProps.value);
      const title = resolvedProps.value.tooltip ? resolvedProps.value.content : undefined;
      const attrs: Record<string, string> = {};
      if (title !== undefined) attrs['title'] = title;
      return h(
        'span',
        {
          class: classList,
          attrs,
        },
        resolvedProps.value.content,
      );
    };
  },
});
