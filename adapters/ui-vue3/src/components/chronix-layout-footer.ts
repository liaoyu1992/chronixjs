import { ensureChronixLayoutStyles, resolveLayoutFooterClassList } from '@chronixjs/ui';
import { defineComponent, h } from 'vue';

export const ChronixLayoutFooter = defineComponent({
  name: 'ChronixLayoutFooter',
  setup(_props, { slots }) {
    ensureChronixLayoutStyles();
    return () => h('footer', { class: resolveLayoutFooterClassList() }, slots['default']?.() ?? []);
  },
});
