import {
  defaultElementProps,
  ensureChronixElementStyles,
  resolveElementClassList,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type VNode } from 'vue';

export const ChronixElement = defineComponent({
  name: 'ChronixElement',
  props: {
    tag: { type: String, default: defaultElementProps.tag },
    inline: { type: Boolean, default: defaultElementProps.inline },
  },
  setup(props, { slots }) {
    ensureChronixElementStyles();
    const resolvedProps = computed(() => ({ tag: props.tag, inline: props.inline }));
    return () => {
      const classList = resolveElementClassList(resolvedProps.value);
      const defaultSlot = slots['default'];
      const children: VNode[] = defaultSlot ? defaultSlot() : [];
      return h(resolvedProps.value.tag, { class: classList }, children);
    };
  },
});
