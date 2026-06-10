import {
  defaultHighlightProps,
  ensureChronixHighlightStyles,
  resolveHighlightClassList,
  splitHighlightSegments,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type VNode } from 'vue';

export const ChronixHighlight = defineComponent({
  name: 'ChronixHighlight',
  props: {
    value: { type: String, default: defaultHighlightProps.value },
    pattern: { type: String, default: defaultHighlightProps.pattern },
    caseSensitive: { type: Boolean, default: defaultHighlightProps.caseSensitive },
  },
  setup(props) {
    ensureChronixHighlightStyles();
    const resolvedProps = computed(() => ({
      value: props.value,
      pattern: props.pattern,
      caseSensitive: props.caseSensitive,
    }));
    return () => {
      const classList = resolveHighlightClassList(resolvedProps.value);
      const segments = splitHighlightSegments(resolvedProps.value);
      const children: VNode[] = segments.map((seg, idx) =>
        seg.matched
          ? h('mark', { key: idx, class: 'cx-ui-highlight__match' }, seg.text)
          : h('span', { key: idx }, seg.text),
      );
      return h('span', { class: classList }, children);
    };
  },
});
