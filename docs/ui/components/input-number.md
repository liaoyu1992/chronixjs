# Input Number 数字输入框

带有递增/递减步进按钮的数字输入组件。

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
  <CxInputNumber v-model:value="count" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxInputNumber } from '@chronixjs/ui-vue3';

const count = ref<number | null>(0);
</script>
```

```vue [Vue 2]
<template>
  <CxInputNumber :value.sync="count" />
</template>

<script>
import { CxInputNumber } from '@chronixjs/ui-vue2';
export default {
  components: { CxInputNumber },
  data() {
    return { count: 0 };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxInputNumber } from '@chronixjs/ui-react';

export function App() {
  const [count, setCount] = useState<number | null>(0);
  return <CxInputNumber value={count} onUpdateValue={setCount} />;
}
```

:::

## 最小值 / 最大值 / 步长

约束值范围并控制递增步长：

::: code-group

```vue [Vue 3]
<template>
  <CxInputNumber v-model:value="quantity" :min="0" :max="100" :step="5" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxInputNumber } from '@chronixjs/ui-vue3';

const quantity = ref<number | null>(0);
</script>
```

```vue [Vue 2]
<template>
  <CxInputNumber :value.sync="quantity" :min="0" :max="100" :step="5" />
</template>

<script>
import { CxInputNumber } from '@chronixjs/ui-vue2';
export default {
  components: { CxInputNumber },
  data() {
    return { quantity: 0 };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxInputNumber } from '@chronixjs/ui-react';

export function App() {
  const [quantity, setQuantity] = useState<number | null>(0);
  return <CxInputNumber value={quantity} onUpdateValue={setQuantity} min={0} max={100} step={5} />;
}
```

:::

## 尺寸

使用 `size` 属性更改数字输入框的大小：

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; flex-direction: column; gap: 8px;">
    <CxInputNumber v-model:value="val" size="small" />
    <CxInputNumber v-model:value="val" size="medium" />
    <CxInputNumber v-model:value="val" size="large" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxInputNumber } from '@chronixjs/ui-vue3';

const val = ref<number | null>(0);
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; flex-direction: column; gap: 8px;">
    <CxInputNumber :value.sync="val" size="small" />
    <CxInputNumber :value.sync="val" size="medium" />
    <CxInputNumber :value.sync="val" size="large" />
  </div>
</template>

<script>
import { CxInputNumber } from '@chronixjs/ui-vue2';
export default {
  components: { CxInputNumber },
  data() {
    return { val: 0 };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxInputNumber } from '@chronixjs/ui-react';

export function App() {
  const [val, setVal] = useState<number | null>(0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <CxInputNumber value={val} onUpdateValue={setVal} size="small" />
      <CxInputNumber value={val} onUpdateValue={setVal} size="medium" />
      <CxInputNumber value={val} onUpdateValue={setVal} size="large" />
    </div>
  );
}
```

:::

## 禁用状态

禁用数字输入框以防止用户交互：

::: code-group

```vue [Vue 3]
<template>
  <CxInputNumber v-model:value="count" disabled />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxInputNumber } from '@chronixjs/ui-vue3';

const count = ref<number | null>(0);
</script>
```

```vue [Vue 2]
<template>
  <CxInputNumber :value.sync="count" disabled />
</template>

<script>
import { CxInputNumber } from '@chronixjs/ui-vue2';
export default {
  components: { CxInputNumber },
  data() {
    return { count: 0 };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxInputNumber } from '@chronixjs/ui-react';

export function App() {
  const [count, setCount] = useState<number | null>(0);
  return <CxInputNumber value={count} onUpdateValue={setCount} disabled />;
}
```

:::

## API 参考

### 属性 (Props)

| Prop       | 类型                             | 默认值      | 描述           |
| ---------- | -------------------------------- | ----------- | -------------- |
| `value`    | `number \| null`                 | `null`      | 当前值         |
| `min`      | `number`                         | `undefined` | 最小值         |
| `max`      | `number`                         | `undefined` | 最大值         |
| `step`     | `number`                         | `1`         | 递增步长       |
| `disabled` | `boolean`                        | `false`     | 是否禁用输入框 |
| `size`     | `'small' \| 'medium' \| 'large'` | `'medium'`  | 输入框尺寸     |
| `error`    | `string`                         | `undefined` | 错误信息       |

### 事件 (Events)

| Event          | Payload          | 描述                    |
| -------------- | ---------------- | ----------------------- |
| `update:value` | `number \| null` | 值变化时触发（v-model） |
