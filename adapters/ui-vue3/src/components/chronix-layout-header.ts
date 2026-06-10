import { ensureChronixLayoutStyles, resolveLayoutHeaderClassList } from '@chronixjs/ui';
import { defineComponent, h } from 'vue';

/**
 * `<ChronixLayoutHeader>` — Vue 3. Phase 28 (2026-06-04). Pure CSS-class
 * wrapper; consumes the Layout stylesheet on first mount. Self-contained
 * (no parent context lookup).
 */
export const ChronixLayoutHeader = defineComponent({
  name: 'ChronixLayoutHeader',
  setup(_props, { slots }) {
    ensureChronixLayoutStyles();
    return () => h('header', { class: resolveLayoutHeaderClassList() }, slots['default']?.() ?? []);
  },
});
