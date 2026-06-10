import { defaultCodeProps, ensureChronixCodeStyles, resolveCodeClassList } from '@chronixjs/ui';
import { computed, defineComponent, h } from 'vue';

export const ChronixCode = defineComponent({
  name: 'ChronixCode',
  props: {
    value: { type: String, default: defaultCodeProps.value },
    inline: { type: Boolean, default: defaultCodeProps.inline },
  },
  setup(props) {
    ensureChronixCodeStyles();
    const resolvedProps = computed(() => ({ value: props.value, inline: props.inline }));
    return () => {
      const classList = resolveCodeClassList(resolvedProps.value);
      if (resolvedProps.value.inline) {
        return h('code', { class: classList }, resolvedProps.value.value);
      }
      return h('pre', { class: classList }, [h('code', undefined, resolvedProps.value.value)]);
    };
  },
});
