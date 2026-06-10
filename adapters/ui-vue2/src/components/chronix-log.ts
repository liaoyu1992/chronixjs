import { defaultLogProps, ensureChronixLogStyles, resolveLogClassList } from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';

/**
 * `<ChronixLog>` — Vue 2.7 port of the Phase 23 Log.
 *
 * DOM shape + class list byte-identical to vue3 sibling.
 * Per-line `<li>` contains optional `<span class="__line-number"
 * aria-hidden="true">` (D.1) + `<span class="__line-content">`.
 */
export const ChronixLog = defineComponent({
  name: 'ChronixLog',
  props: {
    lines: {
      type: Array as PropType<readonly string[]>,
      default: (): readonly string[] => defaultLogProps.lines,
    },
    lineNumbers: {
      type: Boolean,
      default: defaultLogProps.lineNumbers,
    },
    loading: {
      type: Boolean,
      default: defaultLogProps.loading,
    },
    maxHeight: {
      type: Number as PropType<number | undefined>,
      default: defaultLogProps.maxHeight,
    },
    wrapLines: {
      type: Boolean,
      default: defaultLogProps.wrapLines,
    },
  },
  setup(props) {
    ensureChronixLogStyles();

    const resolvedProps = computed(() => ({
      lines: props.lines,
      lineNumbers: props.lineNumbers,
      loading: props.loading,
      maxHeight: props.maxHeight,
      wrapLines: props.wrapLines,
    }));

    return () => {
      const classList = resolveLogClassList(resolvedProps.value);
      const lines = resolvedProps.value.lines;

      const lineNodes: VNode[] = lines.map((line, idx) => {
        const liChildren: VNode[] = [];
        if (resolvedProps.value.lineNumbers) {
          liChildren.push(
            h(
              'span',
              {
                class: 'cx-ui-log__line-number',
                attrs: { 'aria-hidden': 'true' },
              },
              String(idx + 1),
            ),
          );
        }
        liChildren.push(h('span', { class: 'cx-ui-log__line-content' }, line));
        return h('li', { key: idx, class: 'cx-ui-log__line' }, liChildren);
      });

      const children: VNode[] = [h('ol', { class: 'cx-ui-log__lines' }, lineNodes)];

      if (resolvedProps.value.loading) {
        children.push(h('div', { class: 'cx-ui-log__loading' }, 'loading...'));
      }

      const rootStyle: Record<string, string> = {};
      if (resolvedProps.value.maxHeight !== undefined) {
        rootStyle['max-height'] = `${resolvedProps.value.maxHeight}px`;
        rootStyle['overflow'] = 'auto';
      }

      return h(
        'div',
        {
          class: classList,
          style: rootStyle,
        },
        children,
      );
    };
  },
});
