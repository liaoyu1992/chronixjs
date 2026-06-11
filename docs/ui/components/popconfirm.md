<script setup>
import PopconfirmBasic from './demos/popconfirm/PopconfirmBasic.vue';
import popconfirmBasicCode from './demos/popconfirm/PopconfirmBasic.vue?raw';
import popconfirmBasicVue2 from './demos/popconfirm/PopconfirmBasic.vue2?raw';
import popconfirmBasicReact from './demos/popconfirm/PopconfirmBasic.react?raw';
</script>

# Popconfirm 弹出确认

在执行操作前显示确认弹窗，通过点击触发。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="点击触发确认弹窗，显示确认标题。" :code="popconfirmBasicCode" :code-vue2="popconfirmBasicVue2" :code-react="popconfirmBasicReact">
  <PopconfirmBasic />
</DemoBox>

## 自定义按钮文本

使用 `positive-text` 和 `negative-text` 自定义确认和取消按钮的标签。

::: code-group

```vue [Vue 3]
<template>
  <ChronixPopconfirm
    title="This action cannot be undone."
    positive-text="Yes, delete"
    negative-text="No, keep"
    @positive-click="onDelete"
  >
    <ChronixButton type="danger">Delete Item</ChronixButton>
  </ChronixPopconfirm>
</template>

<script setup lang="ts">
import { ChronixPopconfirm, ChronixButton } from '@chronixjs/ui-vue3';

function onDelete() {
  console.log('Item deleted!');
}
</script>
```

```vue [Vue 2]
<template>
  <ChronixPopconfirm
    title="This action cannot be undone."
    positive-text="Yes, delete"
    negative-text="No, keep"
    @positive-click="onDelete"
  >
    <ChronixButton type="danger">Delete Item</ChronixButton>
  </ChronixPopconfirm>
</template>

<script>
import { ChronixPopconfirm, ChronixButton } from '@chronixjs/ui-vue2';
export default {
  components: { ChronixPopconfirm, ChronixButton },
  methods: {
    onDelete() {
      console.log('Item deleted!');
    },
  },
};
</script>
```

```tsx [React]
import { ChronixPopconfirm, ChronixButton } from '@chronixjs/ui-react';

export function App() {
  function onDelete() {
    console.log('Item deleted!');
  }

  return (
    <ChronixPopconfirm
      title="This action cannot be undone."
      positiveText="Yes, delete"
      negativeText="No, keep"
      onPositiveClick={onDelete}
    >
      <ChronixButton type="danger">Delete Item</ChronixButton>
    </ChronixPopconfirm>
  );
}
```

:::

## 弹出位置

确认弹窗支持 12 个弹出位置。默认为 `top`。

可用位置：`top`、`top-start`、`top-end`、`bottom`、`bottom-start`、`bottom-end`、`left`、`left-start`、`left-end`、`right`、`right-start`、`right-end`。

::: code-group

```vue [Vue 3]
<template>
  <ChronixPopconfirm title="Confirm this action?" placement="bottom" @positive-click="onConfirm">
    <ChronixButton>Bottom Placement</ChronixButton>
  </ChronixPopconfirm>
</template>

<script setup lang="ts">
import { ChronixPopconfirm, ChronixButton } from '@chronixjs/ui-vue3';

function onConfirm() {
  console.log('Confirmed!');
}
</script>
```

```vue [Vue 2]
<template>
  <ChronixPopconfirm title="Confirm this action?" placement="bottom" @positive-click="onConfirm">
    <ChronixButton>Bottom Placement</ChronixButton>
  </ChronixPopconfirm>
</template>

<script>
import { ChronixPopconfirm, ChronixButton } from '@chronixjs/ui-vue2';
export default {
  components: { ChronixPopconfirm, ChronixButton },
  methods: {
    onConfirm() {
      console.log('Confirmed!');
    },
  },
};
</script>
```

```tsx [React]
import { ChronixPopconfirm, ChronixButton } from '@chronixjs/ui-react';

export function App() {
  function onConfirm() {
    console.log('Confirmed!');
  }

  return (
    <ChronixPopconfirm title="Confirm this action?" placement="bottom" onPositiveClick={onConfirm}>
      <ChronixButton>Bottom Placement</ChronixButton>
    </ChronixPopconfirm>
  );
}
```

:::

## API 参考

### 属性 (Props)

| 属性           | 类型                                        | 默认值      | 说明           |
| -------------- | ------------------------------------------- | ----------- | -------------- |
| `title`        | `string`                                    | `''`        | 确认文本       |
| `positiveText` | `string`                                    | `'OK'`      | 确认按钮标签   |
| `negativeText` | `string`                                    | `'Cancel'`  | 取消按钮标签   |
| `show`         | `boolean`                                   | `undefined` | 受控的显示状态 |
| `trigger`      | `'hover' \| 'click' \| 'focus' \| 'manual'` | `'click'`   | 触发模式       |
| `placement`    | `PopupPlacement`                            | `'top'`     | 弹出位置       |
| `offset`       | `number`                                    | `4`         | 间距（px）     |
| `flip`         | `boolean`                                   | `true`      | 自动翻转位置   |
| `disabled`     | `boolean`                                   | `false`     | 禁用确认弹窗   |

### 事件 (Events)

| 事件             | 载荷         | 说明         |
| ---------------- | ------------ | ------------ |
| `update:show`    | `boolean`    | 显示状态变化 |
| `positive-click` | `MouseEvent` | 点击确认     |
| `negative-click` | `MouseEvent` | 点击取消     |

### 插槽 (Slots)

| 插槽      | 说明     |
| --------- | -------- |
| `default` | 触发元素 |
