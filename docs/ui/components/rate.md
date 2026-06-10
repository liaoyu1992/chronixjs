# Rate 评分

星级评分输入组件，支持可选的半星精度。

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
  <CxRate v-model:value="rating" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxRate } from '@chronixjs/ui-vue3';

const rating = ref(3);
</script>
```

```vue [Vue 2]
<template>
  <CxRate :value.sync="rating" />
</template>

<script>
import { CxRate } from '@chronixjs/ui-vue2';
export default {
  components: { CxRate },
  data() {
    return { rating: 3 };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxRate } from '@chronixjs/ui-react';

export function App() {
  const [rating, setRating] = useState(3);
  return <CxRate value={rating} onUpdateValue={setRating} />;
}
```

:::

## 半星

通过 `allow-half` 属性启用半星精度。用户可以选择如 3.5 这样的值。

::: code-group

```vue [Vue 3]
<template>
  <CxRate v-model:value="rating" allow-half />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxRate } from '@chronixjs/ui-vue3';

const rating = ref(3.5);
</script>
```

```vue [Vue 2]
<template>
  <CxRate :value.sync="rating" allow-half />
</template>

<script>
import { CxRate } from '@chronixjs/ui-vue2';
export default {
  components: { CxRate },
  data() {
    return { rating: 3.5 };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxRate } from '@chronixjs/ui-react';

export function App() {
  const [rating, setRating] = useState(3.5);
  return <CxRate value={rating} onUpdateValue={setRating} allowHalf />;
}
```

:::

## 自定义星星数量

使用 `count` 属性显示更多（或更少）的星星。默认为 5。

::: code-group

```vue [Vue 3]
<template>
  <CxRate v-model:value="rating" :count="10" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxRate } from '@chronixjs/ui-vue3';

const rating = ref(7);
</script>
```

```vue [Vue 2]
<template>
  <CxRate :value.sync="rating" :count="10" />
</template>

<script>
import { CxRate } from '@chronixjs/ui-vue2';
export default {
  components: { CxRate },
  data() {
    return { rating: 7 };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxRate } from '@chronixjs/ui-react';

export function App() {
  const [rating, setRating] = useState(7);
  return <CxRate value={rating} onUpdateValue={setRating} count={10} />;
}
```

:::

## 只读模式

使用 `readonly` 属性实现仅展示的评分（例如显示平均分数）。

::: code-group

```vue [Vue 3]
<template>
  <CxRate :value="4.5" readonly allow-half />
</template>

<script setup lang="ts">
import { CxRate } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxRate :value="4.5" readonly allow-half />
</template>

<script>
import { CxRate } from '@chronixjs/ui-vue2';
export default {
  components: { CxRate },
};
</script>
```

```tsx [React]
import { CxRate } from '@chronixjs/ui-react';

export function App() {
  return <CxRate value={4.5} readonly allowHalf />;
}
```

:::

## API 参考

### 属性 (Props)

| 属性        | 类型      | 默认值      | 说明         |
| ----------- | --------- | ----------- | ------------ |
| `value`     | `number`  | `0`         | 当前评分     |
| `count`     | `number`  | `5`         | 星星数量     |
| `allowHalf` | `boolean` | `false`     | 半星精度     |
| `disabled`  | `boolean` | `false`     | 禁用交互     |
| `readonly`  | `boolean` | `false`     | 只读显示     |
| `error`     | `string`  | `undefined` | 错误提示信息 |

### 事件 (Events)

| 事件           | 载荷     | 说明     |
| -------------- | -------- | -------- |
| `update:value` | `number` | 评分变化 |
