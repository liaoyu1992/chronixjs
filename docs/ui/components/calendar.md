# Calendar 日历

独立日历（始终可见，无弹窗），用于日期选择。

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
  <CxCalendar v-model:value="selected" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxCalendar } from '@chronixjs/ui-vue3';

const selected = ref<Date | undefined>(undefined);
</script>
```

```vue [Vue 2]
<template>
  <CxCalendar :value.sync="selected" />
</template>

<script>
import { CxCalendar } from '@chronixjs/ui-vue2';
export default {
  components: { CxCalendar },
  data() {
    return { selected: undefined };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxCalendar } from '@chronixjs/ui-react';

export function App() {
  const [selected, setSelected] = useState<Date | undefined>(undefined);

  return <CxCalendar value={selected} onUpdateValue={setSelected} />;
}
```

:::

## 禁用日期

::: code-group

```vue [Vue 3]
<template>
  <CxCalendar v-model:value="selected" :is-date-disabled="isWeekend" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxCalendar } from '@chronixjs/ui-vue3';

const selected = ref<Date | undefined>(undefined);

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}
</script>
```

```vue [Vue 2]
<template>
  <CxCalendar :value.sync="selected" :is-date-disabled="isWeekend" />
</template>

<script>
import { CxCalendar } from '@chronixjs/ui-vue2';
export default {
  components: { CxCalendar },
  data() {
    return { selected: undefined };
  },
  methods: {
    isWeekend(date) {
      const day = date.getDay();
      return day === 0 || day === 6;
    },
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxCalendar } from '@chronixjs/ui-react';

export function App() {
  const [selected, setSelected] = useState<Date | undefined>(undefined);

  function isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  return <CxCalendar value={selected} onUpdateValue={setSelected} isDateDisabled={isWeekend} />;
}
```

:::

## API 参考

### 属性 (Props)

| 属性             | 类型                      | 默认值      | 说明                   |
| ---------------- | ------------------------- | ----------- | ---------------------- |
| `value`          | `Date \| undefined`       | `undefined` | 当前选中的日期         |
| `disabled`       | `boolean`                 | `false`     | 禁用整个日历           |
| `isDateDisabled` | `(date: Date) => boolean` | `undefined` | 禁用特定日期的回调函数 |

### 事件 (Events)

| 事件           | 载荷                | 说明           |
| -------------- | ------------------- | -------------- |
| `update:value` | `Date \| undefined` | 选择日期时触发 |
