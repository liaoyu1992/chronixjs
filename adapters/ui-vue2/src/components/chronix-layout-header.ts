import { ensureChronixLayoutStyles, resolveLayoutHeaderClassList } from '@chronixjs/ui';
import { defineComponent, h } from 'vue';

export const ChronixLayoutHeader = defineComponent({
  name: 'ChronixLayoutHeader',
  setup(_props, { slots }) {
    ensureChronixLayoutStyles();
    return () => h('header', { class: resolveLayoutHeaderClassList() }, slots['default']?.() ?? []);
  },
});
