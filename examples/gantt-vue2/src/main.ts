import Vue from 'vue';

import DemoApp from './DemoApp.vue';
import './styles.css';

/**
 * Phase 46: the prior URL-flag module exports (PARITY_MODE,
 * PARITY_WEEKENDS_VISIBLE, PARITY_USE_LINE_EVENT_COLOR,
 * PARITY_PRIORITY_CALLBACK) were folded into the `useDemoConfig`
 * schema in DemoApp.vue. Cross-demo parity Playwright tests continue
 * to drive the same URL flags (`?parity=true` / `?weekends=false` /
 * `?useLineEventColor=true` / `?priorityCallback=true`); the demo
 * reads them via the schema instead of separate module-load consts.
 */
new Vue({ render: (h) => h(DemoApp) }).$mount('#app');
