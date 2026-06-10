# Collapse Transition 折叠过渡

用于展开/收起动画的高度过渡包装器。内部由 Collapse 使用，同时暴露给外部使用。

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
  <button @click="visible = !visible">Toggle</button>
  <CxCollapseTransition :show="visible">
    <div style="padding: 16px;">Collapsible content here.</div>
  </CxCollapseTransition>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxCollapseTransition } from '@chronixjs/ui-vue3';

const visible = ref(false);
</script>
```

```vue [Vue 2]
<template>
  <button @click="visible = !visible">Toggle</button>
  <CxCollapseTransition :show="visible">
    <div style="padding: 16px;">Collapsible content here.</div>
  </CxCollapseTransition>
</template>

<script>
import { CxCollapseTransition } from '@chronixjs/ui-vue2';
export default {
  components: { CxCollapseTransition },
  data() {
    return { visible: false };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxCollapseTransition } from '@chronixjs/ui-react';

export function App() {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <button onClick={() => setVisible(!visible)}>Toggle</button>
      <CxCollapseTransition show={visible}>
        <div style={{ padding: 16 }}>Collapsible content here.</div>
      </CxCollapseTransition>
    </div>
  );
}
```

:::

## API 参考

### 属性 (Props)

| 属性       | 类型      | 默认值  | 说明                          |
| ---------- | --------- | ------- | ----------------------------- |
| `show`     | `boolean` | `false` | `true` = 展开，`false` = 收起 |
| `duration` | `number`  | `200`   | 动画持续时间（毫秒）          |

### 插槽 (Slots)

| 插槽      | 说明           |
| --------- | -------------- |
| `default` | 需要过渡的内容 |
