# Timeline 时间线

带有彩色指示器和连接线的按时间顺序展示事件。

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
  <CxTimeline :items="items" />
</template>

<script setup lang="ts">
import { CxTimeline } from '@chronixjs/ui-vue3';

const items = [
  {
    key: '1',
    title: 'Event 1',
    description: 'First event happened',
    timestamp: '2024-01-01',
    color: 'success',
  },
  {
    key: '2',
    title: 'Event 2',
    description: 'Second event happened',
    timestamp: '2024-01-15',
    color: 'info',
  },
  {
    key: '3',
    title: 'Event 3',
    description: 'Third event happened',
    timestamp: '2024-02-01',
    color: 'default',
  },
];
</script>
```

```vue [Vue 2]
<template>
  <CxTimeline :items="items" />
</template>

<script>
import { CxTimeline } from '@chronixjs/ui-vue2';

export default {
  components: { CxTimeline },
  data() {
    return {
      items: [
        {
          key: '1',
          title: 'Event 1',
          description: 'First event happened',
          timestamp: '2024-01-01',
          color: 'success',
        },
        {
          key: '2',
          title: 'Event 2',
          description: 'Second event happened',
          timestamp: '2024-01-15',
          color: 'info',
        },
        {
          key: '3',
          title: 'Event 3',
          description: 'Third event happened',
          timestamp: '2024-02-01',
          color: 'default',
        },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { CxTimeline } from '@chronixjs/ui-react';

const items = [
  {
    key: '1',
    title: 'Event 1',
    description: 'First event happened',
    timestamp: '2024-01-01',
    color: 'success',
  },
  {
    key: '2',
    title: 'Event 2',
    description: 'Second event happened',
    timestamp: '2024-01-15',
    color: 'info',
  },
  {
    key: '3',
    title: 'Event 3',
    description: 'Third event happened',
    timestamp: '2024-02-01',
    color: 'default',
  },
];

export function App() {
  return <CxTimeline items={items} />;
}
```

:::

## 自定义颜色

使用每项的 `color` 字段设置指示器颜色。可用颜色为 `default`、`success`、`warning`、`error` 和 `info`。

::: code-group

```vue [Vue 3]
<template>
  <CxTimeline :items="items" />
</template>

<script setup lang="ts">
import { CxTimeline } from '@chronixjs/ui-vue3';

const items = [
  {
    key: '1',
    title: 'Default',
    description: 'Default color indicator',
    timestamp: '2024-01-01',
    color: 'default',
  },
  {
    key: '2',
    title: 'Success',
    description: 'Success color indicator',
    timestamp: '2024-01-05',
    color: 'success',
  },
  {
    key: '3',
    title: 'Warning',
    description: 'Warning color indicator',
    timestamp: '2024-01-10',
    color: 'warning',
  },
  {
    key: '4',
    title: 'Error',
    description: 'Error color indicator',
    timestamp: '2024-01-15',
    color: 'error',
  },
  {
    key: '5',
    title: 'Info',
    description: 'Info color indicator',
    timestamp: '2024-01-20',
    color: 'info',
  },
];
</script>
```

```vue [Vue 2]
<template>
  <CxTimeline :items="items" />
</template>

<script>
import { CxTimeline } from '@chronixjs/ui-vue2';

export default {
  components: { CxTimeline },
  data() {
    return {
      items: [
        {
          key: '1',
          title: 'Default',
          description: 'Default color indicator',
          timestamp: '2024-01-01',
          color: 'default',
        },
        {
          key: '2',
          title: 'Success',
          description: 'Success color indicator',
          timestamp: '2024-01-05',
          color: 'success',
        },
        {
          key: '3',
          title: 'Warning',
          description: 'Warning color indicator',
          timestamp: '2024-01-10',
          color: 'warning',
        },
        {
          key: '4',
          title: 'Error',
          description: 'Error color indicator',
          timestamp: '2024-01-15',
          color: 'error',
        },
        {
          key: '5',
          title: 'Info',
          description: 'Info color indicator',
          timestamp: '2024-01-20',
          color: 'info',
        },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { CxTimeline } from '@chronixjs/ui-react';

const items = [
  {
    key: '1',
    title: 'Default',
    description: 'Default color indicator',
    timestamp: '2024-01-01',
    color: 'default',
  },
  {
    key: '2',
    title: 'Success',
    description: 'Success color indicator',
    timestamp: '2024-01-05',
    color: 'success',
  },
  {
    key: '3',
    title: 'Warning',
    description: 'Warning color indicator',
    timestamp: '2024-01-10',
    color: 'warning',
  },
  {
    key: '4',
    title: 'Error',
    description: 'Error color indicator',
    timestamp: '2024-01-15',
    color: 'error',
  },
  {
    key: '5',
    title: 'Info',
    description: 'Info color indicator',
    timestamp: '2024-01-20',
    color: 'info',
  },
];

export function App() {
  return <CxTimeline items={items} />;
}
```

:::

## 虚线

在时间线项上使用 `lineType: 'dashed'` 来渲染虚线连接线，替代默认的实线。

::: code-group

```vue [Vue 3]
<template>
  <CxTimeline :items="items" />
</template>

<script setup lang="ts">
import { CxTimeline } from '@chronixjs/ui-vue3';

const items = [
  {
    key: '1',
    title: 'Step 1',
    description: 'First event happened',
    timestamp: '2024-01-01',
    color: 'success',
  },
  {
    key: '2',
    title: 'Step 2',
    description: 'Second event happened',
    timestamp: '2024-01-15',
    color: 'info',
    lineType: 'dashed',
  },
  {
    key: '3',
    title: 'Step 3',
    description: 'Third event happened',
    timestamp: '2024-02-01',
    color: 'default',
  },
];
</script>
```

```vue [Vue 2]
<template>
  <CxTimeline :items="items" />
</template>

<script>
import { CxTimeline } from '@chronixjs/ui-vue2';

export default {
  components: { CxTimeline },
  data() {
    return {
      items: [
        {
          key: '1',
          title: 'Step 1',
          description: 'First event happened',
          timestamp: '2024-01-01',
          color: 'success',
        },
        {
          key: '2',
          title: 'Step 2',
          description: 'Second event happened',
          timestamp: '2024-01-15',
          color: 'info',
          lineType: 'dashed',
        },
        {
          key: '3',
          title: 'Step 3',
          description: 'Third event happened',
          timestamp: '2024-02-01',
          color: 'default',
        },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { CxTimeline } from '@chronixjs/ui-react';

const items = [
  {
    key: '1',
    title: 'Step 1',
    description: 'First event happened',
    timestamp: '2024-01-01',
    color: 'success',
  },
  {
    key: '2',
    title: 'Step 2',
    description: 'Second event happened',
    timestamp: '2024-01-15',
    color: 'info',
    lineType: 'dashed',
  },
  {
    key: '3',
    title: 'Step 3',
    description: 'Third event happened',
    timestamp: '2024-02-01',
    color: 'default',
  },
];

export function App() {
  return <CxTimeline items={items} />;
}
```

:::

## API 参考

### 属性 (Props)

| 属性    | 类型             | 默认值 | 说明           |
| ------- | ---------------- | ------ | -------------- |
| `items` | `TimelineItem[]` | `[]`   | 时间线条目数组 |

### TimelineItem 接口

| 字段          | 类型                                                       | 默认值      | 说明       |
| ------------- | ---------------------------------------------------------- | ----------- | ---------- |
| `key`         | `string`                                                   | --          | 唯一键     |
| `title`       | `string`                                                   | --          | 事件标题   |
| `description` | `string`                                                   | `undefined` | 事件描述   |
| `timestamp`   | `string`                                                   | `undefined` | 时间戳文本 |
| `color`       | `'default' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'default'` | 指示器颜色 |
| `lineType`    | `'default' \| 'dashed'`                                    | `'default'` | 线条样式   |
