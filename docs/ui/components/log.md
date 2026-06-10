# Log

Terminal-output viewer for CI, deploy, audit-trail, or build-output consumption.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

::: code-group

```vue [Vue 3]
<template>
  <CxLog :lines="lines" line-numbers :max-height="300" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxLog } from '@chronixjs/ui-vue3';

const lines = ref([
  '$ pnpm install',
  'Packages: +128',
  '+124 packages in 3.2s',
  '$ pnpm build',
  'Building chronix-ui...',
  '✓ 85 components built in 12.4s',
  'Done in 15.6s',
]);
</script>
```

```vue [Vue 2]
<template>
  <CxLog :lines="lines" line-numbers :max-height="300" />
</template>

<script>
import { CxLog } from '@chronixjs/ui-vue2';
export default {
  components: { CxLog },
  data() {
    return {
      lines: [
        '$ pnpm install',
        'Packages: +128',
        '+124 packages in 3.2s',
        '$ pnpm build',
        'Building chronix-ui...',
        '✓ 85 components built in 12.4s',
        'Done in 15.6s',
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxLog } from '@chronixjs/ui-react';

export function App() {
  const [lines] = useState([
    '$ pnpm install',
    'Packages: +128',
    '+124 packages in 3.2s',
    '$ pnpm build',
    'Building chronix-ui...',
    '✓ 85 components built in 12.4s',
    'Done in 15.6s',
  ]);

  return <CxLog lines={lines} lineNumbers maxHeight={300} />;
}
```

:::

## API Reference

### Props

| Prop          | Type                  | Default     | Description                                 |
| ------------- | --------------------- | ----------- | ------------------------------------------- |
| `lines`       | `readonly string[]`   | `[]`        | Ordered lines to render                     |
| `lineNumbers` | `boolean`             | `false`     | Show line numbers                           |
| `loading`     | `boolean`             | `false`     | Show "loading..." row below lines           |
| `maxHeight`   | `number \| undefined` | `undefined` | Max height in px (becomes scroll container) |
| `wrapLines`   | `boolean`             | `false`     | Wrap long lines (`pre-wrap` vs `pre`)       |
