import {
  defaultEllipsisProps,
  ensureChronixEllipsisStyles,
  resolveEllipsisClassList,
} from '@chronixjs/ui';
import { computed, defineComponent, h } from 'vue';

/**
 * `<ChronixEllipsis>` — Vue 3 SFC wrapping the core `EllipsisProps`
 * IR. . Tier A text-truncation primitive.
 *
 * Root element is `<span>` (NOT `<div>`) — 23-fr2: inline element
 * so it composes within inline flows without forcing block layout.
 *
 * When `props.tooltip === true`, the adapter sets a native HTML
 * `title="${props.content}"` attribute on the root; Vue 3 strips
 * `undefined` attribute values so `tooltip=false` results in no
 * `title` attribute at all.
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
      return h(
        'span',
        {
          class: classList,
          title,
        },
        resolvedProps.value.content,
      );
    };
  },
});
