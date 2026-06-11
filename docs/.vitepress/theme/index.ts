import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import * as ChronixUI from '@chronixjs/ui-vue3';
import DemoBox from './components/DemoBox.vue';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Register DemoBox globally
    app.component('DemoBox', DemoBox);

    // Register all Chronix components globally so they're available in .md files
    for (const [name, comp] of Object.entries(ChronixUI)) {
      if (name.startsWith('Chronix') && typeof comp === 'object' && comp !== null) {
        app.component(name, comp as any);
      }
    }
  },
} satisfies Theme;
