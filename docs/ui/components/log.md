# Log 日志

终端输出查看器，适用于 CI、部署、审计追踪或构建输出的展示。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## 基础用法

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

## API 参考

### 属性 (Props)

| Prop          | 类型                  | 默认值      | 描述                                 |
| ------------- | --------------------- | ----------- | ------------------------------------ |
| `lines`       | `readonly string[]`   | `[]`        | 按顺序渲染的行内容                   |
| `lineNumbers` | `boolean`             | `false`     | 是否显示行号                         |
| `loading`     | `boolean`             | `false`     | 是否在行下方显示 "loading..." 行     |
| `maxHeight`   | `number \| undefined` | `undefined` | 最大高度（像素），超出后变为滚动容器 |
| `wrapLines`   | `boolean`             | `false`     | 是否换行长行（`pre-wrap` 与 `pre`）  |
