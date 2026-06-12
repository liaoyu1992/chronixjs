<script setup>
import StatisticBasic from './demos/statistic/StatisticBasic.vue';
import statisticBasicCode from './demos/statistic/StatisticBasic.vue?raw';
import statisticBasicVue2 from './demos/statistic/StatisticBasic.vue2?raw';
import statisticBasicReact from './demos/statistic/StatisticBasic.react?raw';
</script>

# Statistic 统计数值

用于仪表板和 KPI 摘要的数值展示组件，支持可选的前缀/后缀。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="展示带有标签的数值。" :code="statisticBasicCode" :code-vue2="statisticBasicVue2" :code-react="statisticBasicReact">
  <StatisticBasic />
</DemoBox>

## 精度

::: code-group

```vue [Vue 3]
<template>
  <CxStatistic label="Conversion Rate" :value="0.8563" :precision="2" />
</template>

<script setup lang="ts">
import { CxStatistic } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxStatistic label="Conversion Rate" :value="0.8563" :precision="2" />
</template>

<script>
import { CxStatistic } from '@chronixjs/ui-vue2';
export default { components: { CxStatistic } };
</script>
```

```tsx [React]
import { CxStatistic } from '@chronixjs/ui-react';

export function App() {
  return <CxStatistic label="Conversion Rate" value={0.8563} precision={2} />;
}
```

:::

## 前缀和后缀

::: code-group

```vue [Vue 3]
<template>
  <CxStatistic label="Revenue" :value="99999">
    <template #prefix>$</template>
    <template #suffix>USD</template>
  </CxStatistic>
</template>

<script setup lang="ts">
import { CxStatistic } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxStatistic label="Revenue" :value="99999">
    <template slot="prefix">$</template>
    <template slot="suffix">USD</template>
  </CxStatistic>
</template>

<script>
import { CxStatistic } from '@chronixjs/ui-vue2';
export default { components: { CxStatistic } };
</script>
```

```tsx [React]
import { CxStatistic } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxStatistic label="Revenue" value={99999} prefix={<span>$</span>} suffix={<span>USD</span>} />
  );
}
```

:::

## API 参考

### 属性 (Props)

| 属性          | 类型                            | 默认值      | 说明                             |
| ------------- | ------------------------------- | ----------- | -------------------------------- |
| `label`       | `string \| undefined`           | `undefined` | 数值上方的标题标签               |
| `value`       | `number \| string \| undefined` | `undefined` | 显示值；数字会经过格式化处理     |
| `precision`   | `number \| undefined`           | `undefined` | 数值的小数精度                   |
| `tabularNums` | `boolean`                       | `true`      | 使用 `tabular-nums` 对齐数字宽度 |

### 插槽 (Slots)

| 插槽     | 说明             |
| -------- | ---------------- |
| `prefix` | 数值前渲染的内容 |
| `suffix` | 数值后渲染的内容 |
