# Modal 模态框

通过 Portal 挂载的居中浮层面板，带有半透明遮罩、焦点陷阱、滚动锁定和 Escape 关闭功能。

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
  <button @click="show = true">Open Modal</button>
  <CxModal v-model:show="show" title="Confirm">
    <p>Are you sure you want to proceed?</p>
    <template #footer>
      <button @click="show = false">Cancel</button>
      <button @click="show = false">Confirm</button>
    </template>
  </CxModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxModal } from '@chronixjs/ui-vue3';

const show = ref(false);
</script>
```

```vue [Vue 2]
<template>
  <button @click="show = true">Open Modal</button>
  <CxModal :show.sync="show" title="Confirm">
    <p>Are you sure you want to proceed?</p>
    <template #footer>
      <button @click="show = false">Cancel</button>
      <button @click="show = false">Confirm</button>
    </template>
  </CxModal>
</template>

<script>
import { CxModal } from '@chronixjs/ui-vue2';
export default {
  components: { CxModal },
  data() {
    return { show: false };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxModal } from '@chronixjs/ui-react';

export function App() {
  const [show, setShow] = useState(false);

  return (
    <div>
      <button onClick={() => setShow(true)}>Open Modal</button>
      <CxModal show={show} onUpdateShow={setShow} title="Confirm">
        <p>Are you sure you want to proceed?</p>
      </CxModal>
    </div>
  );
}
```

:::

## API 参考

### 属性 (Props)

| Prop           | 类型                   | 默认值      | 说明                                     |
| -------------- | ---------------------- | ----------- | ---------------------------------------- |
| `show`         | `boolean \| undefined` | `undefined` | 受控的显示状态                           |
| `title`        | `string \| undefined`  | `undefined` | 模态框标题                               |
| `mask`         | `boolean`              | `true`      | 显示半透明遮罩背景                       |
| `maskClosable` | `boolean`              | `true`      | 点击遮罩关闭                             |
| `escClosable`  | `boolean`              | `true`      | 按 Escape 键关闭                         |
| `width`        | `number \| string`     | `520`       | 面板宽度（数字 → px，字符串 → 原样使用） |
| `disabled`     | `boolean`              | `false`     | 阻止打开                                 |

### 事件 (Events)

| 事件          | 载荷                                | 说明               |
| ------------- | ----------------------------------- | ------------------ |
| `update:show` | `boolean`                           | 显示状态变化时触发 |
| `close`       | `'mask' \| 'esc' \| 'close-button'` | 关闭时携带关闭原因 |

### 插槽 (Slots)

| 插槽      | 说明                   |
| --------- | ---------------------- |
| `default` | 模态框主体内容         |
| `header`  | 自定义头部（替代标题） |
| `footer`  | 底部操作栏             |
