# DatePicker 日期选择器

带有格式控制和日期禁用功能的日期选择日历。

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
  <CxDatePicker v-model:value="date" placeholder="Pick a date" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxDatePicker } from '@chronixjs/ui-vue3';

const date = ref<Date | undefined>(undefined);
</script>
```

```vue [Vue 2]
<template>
  <CxDatePicker :value.sync="date" placeholder="Pick a date" />
</template>

<script>
import { CxDatePicker } from '@chronixjs/ui-vue2';

export default {
  components: { CxDatePicker },
  data() {
    return {
      date: undefined,
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxDatePicker } from '@chronixjs/ui-react';

export function App() {
  const [date, setDate] = useState<Date | undefined>(undefined);

  return <CxDatePicker value={date} onUpdateValue={setDate} placeholder="Pick a date" />;
}
```

:::

## 格式化

使用 date-fns 格式字符串自定义显示格式。默认为 `yyyy-MM-dd`。

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; gap: 12px;">
    <CxDatePicker v-model:value="date1" format="dd/MM/yyyy" placeholder="dd/MM/yyyy" />
    <CxDatePicker v-model:value="date2" format="MM-dd-yyyy" placeholder="MM-dd-yyyy" />
    <CxDatePicker v-model:value="date3" format="yyyy.MM.dd" placeholder="yyyy.MM.dd" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxDatePicker } from '@chronixjs/ui-vue3';

const date1 = ref<Date | undefined>(undefined);
const date2 = ref<Date | undefined>(undefined);
const date3 = ref<Date | undefined>(undefined);
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; gap: 12px;">
    <CxDatePicker :value.sync="date1" format="dd/MM/yyyy" placeholder="dd/MM/yyyy" />
    <CxDatePicker :value.sync="date2" format="MM-dd-yyyy" placeholder="MM-dd-yyyy" />
    <CxDatePicker :value.sync="date3" format="yyyy.MM.dd" placeholder="yyyy.MM.dd" />
  </div>
</template>

<script>
import { CxDatePicker } from '@chronixjs/ui-vue2';

export default {
  components: { CxDatePicker },
  data() {
    return {
      date1: undefined,
      date2: undefined,
      date3: undefined,
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxDatePicker } from '@chronixjs/ui-react';

export function App() {
  const [date1, setDate1] = useState<Date | undefined>(undefined);
  const [date2, setDate2] = useState<Date | undefined>(undefined);
  const [date3, setDate3] = useState<Date | undefined>(undefined);

  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <CxDatePicker
        value={date1}
        onUpdateValue={setDate1}
        format="dd/MM/yyyy"
        placeholder="dd/MM/yyyy"
      />
      <CxDatePicker
        value={date2}
        onUpdateValue={setDate2}
        format="MM-dd-yyyy"
        placeholder="MM-dd-yyyy"
      />
      <CxDatePicker
        value={date3}
        onUpdateValue={setDate3}
        format="yyyy.MM.dd"
        placeholder="yyyy.MM.dd"
      />
    </div>
  );
}
```

:::

## 禁用日期

使用 `isDateDisabled` 回调函数来阻止选择特定日期。下面的示例禁用了所有周末。

::: code-group

```vue [Vue 3]
<template>
  <CxDatePicker v-model:value="date" :is-date-disabled="isDateDisabled" placeholder="No weekends" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxDatePicker } from '@chronixjs/ui-vue3';

const date = ref<Date | undefined>(undefined);

function isDateDisabled(dateValue: Date): boolean {
  const day = dateValue.getDay();
  return day === 0 || day === 6;
}
</script>
```

```vue [Vue 2]
<template>
  <CxDatePicker :value.sync="date" :is-date-disabled="isDateDisabled" placeholder="No weekends" />
</template>

<script>
import { CxDatePicker } from '@chronixjs/ui-vue2';

export default {
  components: { CxDatePicker },
  data() {
    return {
      date: undefined,
    };
  },
  methods: {
    isDateDisabled(dateValue) {
      const day = dateValue.getDay();
      return day === 0 || day === 6;
    },
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxDatePicker } from '@chronixjs/ui-react';

export function App() {
  const [date, setDate] = useState<Date | undefined>(undefined);

  function isDateDisabled(dateValue: Date): boolean {
    const day = dateValue.getDay();
    return day === 0 || day === 6;
  }

  return (
    <CxDatePicker
      value={date}
      onUpdateValue={setDate}
      isDateDisabled={isDateDisabled}
      placeholder="No weekends"
    />
  );
}
```

:::

## 可清除

添加 `clearable` 属性让用户可以清除已选日期。

::: code-group

```vue [Vue 3]
<template>
  <CxDatePicker v-model:value="date" clearable placeholder="Pick and clear" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxDatePicker } from '@chronixjs/ui-vue3';

const date = ref<Date | undefined>(undefined);
</script>
```

```vue [Vue 2]
<template>
  <CxDatePicker :value.sync="date" clearable placeholder="Pick and clear" />
</template>

<script>
import { CxDatePicker } from '@chronixjs/ui-vue2';

export default {
  components: { CxDatePicker },
  data() {
    return {
      date: undefined,
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxDatePicker } from '@chronixjs/ui-react';

export function App() {
  const [date, setDate] = useState<Date | undefined>(undefined);

  return (
    <CxDatePicker value={date} onUpdateValue={setDate} clearable placeholder="Pick and clear" />
  );
}
```

:::

## API 参考

### 属性 (Props)

| 属性             | 类型                      | 默认值           | 说明                           |
| ---------------- | ------------------------- | ---------------- | ------------------------------ |
| `value`          | `Date \| undefined`       | `undefined`      | 选中的日期                     |
| `format`         | `string`                  | `'yyyy-MM-dd'`   | date-fns 格式字符串            |
| `placeholder`    | `string`                  | `''`             | 占位文本                       |
| `disabled`       | `boolean`                 | `false`          | 禁用选择器                     |
| `clearable`      | `boolean`                 | `false`          | 显示清除图标                   |
| `placement`      | `PopupPlacement`          | `'bottom-start'` | 日历弹出位置                   |
| `firstDayOfWeek` | `number`                  | `0`              | 一周的第一天（0=周日，1=周一） |
| `isDateDisabled` | `(date: Date) => boolean` | `undefined`      | 日期禁用回调函数               |

### 事件 (Events)

| 事件           | 载荷                | 说明           |
| -------------- | ------------------- | -------------- |
| `update:value` | `Date \| undefined` | 日期变化时触发 |
