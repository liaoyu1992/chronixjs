import { defaultLogProps, ensureChronixLogStyles, resolveLogClassList } from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type StyleValue, type VNode } from 'vue';

/**
 * `<ChronixLog>` — Vue 3 SFC wrapping the core `LogProps` IR.
 * . Tier A terminal-output viewer.
 *
 * Per Decision D.1 the per-line number is rendered as real DOM
 * text in a `<span class="__line-number" aria-hidden="true">`
 * (NOT via CSS `counter-increment` + `::before`).
 *
 * Per Decision A.1 + D.1, items come exclusively from the
 * `lines` array prop — no scoped slots / render-props.
 *
 * No emits — Log is a pure-visual primitive.
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
                'aria-hidden': 'true',
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

      const rootStyle: StyleValue | undefined =
        resolvedProps.value.maxHeight !== undefined
          ? {
              maxHeight: `${resolvedProps.value.maxHeight}px`,
              overflow: 'auto',
            }
          : undefined;

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
