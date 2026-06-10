# Heatmap 热力图

SVG 单元格网格，在两个端点颜色之间进行线性颜色插值。

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
  <CxHeatmap :cells="cells" :cell-size="20" color-low="#dbeafe" color-high="#1e3a8a" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxHeatmap } from '@chronixjs/ui-vue3';

const cells = ref([
  [1, 3, 5, 7],
  [2, 4, 6, 8],
  [0, 1, 9, 10],
]);
</script>
```

```vue [Vue 2]
<template>
  <CxHeatmap :cells="cells" :cell-size="20" color-low="#dbeafe" color-high="#1e3a8a" />
</template>

<script>
import { CxHeatmap } from '@chronixjs/ui-vue2';
export default {
  components: { CxHeatmap },
  data() {
    return {
      cells: [
        [1, 3, 5, 7],
        [2, 4, 6, 8],
        [0, 1, 9, 10],
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxHeatmap } from '@chronixjs/ui-react';

export function App() {
  const [cells] = useState([
    [1, 3, 5, 7],
    [2, 4, 6, 8],
    [0, 1, 9, 10],
  ]);

  return <CxHeatmap cells={cells} cellSize={20} colorLow="#dbeafe" colorHigh="#1e3a8a" />;
}
```

:::

## API 参考

### 属性 (Props)

| Prop        | 类型                             | 默认值      | 描述               |
| ----------- | -------------------------------- | ----------- | ------------------ |
| `cells`     | `readonly (readonly number[])[]` | `[]`        | 数值型二维矩阵     |
| `cellSize`  | `number`                         | `20`        | 单元格宽高（像素） |
| `colorLow`  | `string`                         | `'#dbeafe'` | 最小值对应的颜色   |
| `colorHigh` | `string`                         | `'#1e3a8a'` | 最大值对应的颜色   |
