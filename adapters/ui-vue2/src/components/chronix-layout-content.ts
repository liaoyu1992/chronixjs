import { ensureChronixLayoutStyles, resolveLayoutContentClassList } from '@chronixjs/ui';
import { defineComponent, h } from 'vue';

export const ChronixLayoutContent = defineComponent({
  name: 'ChronixLayoutContent',
  setup(_props, { slots }) {
    ensureChronixLayoutStyles();
    return () => h('main', { class: resolveLayoutContentClassList() }, slots['default']?.() ?? []);
  },
});
