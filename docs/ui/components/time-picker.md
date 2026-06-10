# TimePicker 时间选择器

带有可滚动时/分/秒列的时间选择器。

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
  <CxTimePicker v-model:value="time" placeholder="Pick a time" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxTimePicker } from '@chronixjs/ui-vue3';

const time = ref<Date | undefined>(undefined);
</script>
```

```vue [Vue 2]
<template>
  <CxTimePicker :value.sync="time" placeholder="Pick a time" />
</template>

<script>
import { CxTimePicker } from '@chronixjs/ui-vue2';

export default {
  components: { CxTimePicker },
  data() {
    return {
      time: undefined,
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxTimePicker } from '@chronixjs/ui-react';

export function App() {
  const [time, setTime] = useState<Date | undefined>(undefined);

  return <CxTimePicker value={time} onUpdateValue={setTime} placeholder="Pick a time" />;
}
```

:::

## 格式化

使用 date-fns 格式字符串自定义显示格式。默认为 `HH:mm:ss`。使用 `format="HH:mm"` 仅显示小时和分钟。

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; gap: 12px;">
    <CxTimePicker v-model:value="time1" format="HH:mm:ss" placeholder="HH:mm:ss" />
    <CxTimePicker v-model:value="time2" format="HH:mm" placeholder="HH:mm" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxTimePicker } from '@chronixjs/ui-vue3';

const time1 = ref<Date | undefined>(undefined);
const time2 = ref<Date | undefined>(undefined);
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; gap: 12px;">
    <CxTimePicker :value.sync="time1" format="HH:mm:ss" placeholder="HH:mm:ss" />
    <CxTimePicker :value.sync="time2" format="HH:mm" placeholder="HH:mm" />
  </div>
</template>

<script>
import { CxTimePicker } from '@chronixjs/ui-vue2';

export default {
  components: { CxTimePicker },
  data() {
    return {
      time1: undefined,
      time2: undefined,
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxTimePicker } from '@chronixjs/ui-react';

export function App() {
  const [time1, setTime1] = useState<Date | undefined>(undefined);
  const [time2, setTime2] = useState<Date | undefined>(undefined);

  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <CxTimePicker
        value={time1}
        onUpdateValue={setTime1}
        format="HH:mm:ss"
        placeholder="HH:mm:ss"
      />
      <CxTimePicker value={time2} onUpdateValue={setTime2} format="HH:mm" placeholder="HH:mm" />
    </div>
  );
}
```

:::

## 12 小时制

将 `use12-hours` 设置为 `true` 以显示带有上午/下午切换的 12 小时制时钟。

::: code-group

```vue [Vue 3]
<template>
  <CxTimePicker v-model:value="time" use12-hours placeholder="12-hour format" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxTimePicker } from '@chronixjs/ui-vue3';

const time = ref<Date | undefined>(undefined);
</script>
```

```vue [Vue 2]
<template>
  <CxTimePicker :value.sync="time" use12-hours placeholder="12-hour format" />
</template>

<script>
import { CxTimePicker } from '@chronixjs/ui-vue2';

export default {
  components: { CxTimePicker },
  data() {
    return {
      time: undefined,
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxTimePicker } from '@chronixjs/ui-react';

export function App() {
  const [time, setTime] = useState<Date | undefined>(undefined);

  return (
    <CxTimePicker value={time} onUpdateValue={setTime} use12Hours placeholder="12-hour format" />
  );
}
```

:::

## 步长

使用 `hour-step` 和 `minute-step` 在滚动时间列时按固定增量跳跃。

::: code-group

```vue [Vue 3]
<template>
  <CxTimePicker v-model:value="time" :hour-step="2" :minute-step="15" placeholder="Stepped time" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxTimePicker } from '@chronixjs/ui-vue3';

const time = ref<Date | undefined>(undefined);
</script>
```

```vue [Vue 2]
<template>
  <CxTimePicker :value.sync="time" :hour-step="2" :minute-step="15" placeholder="Stepped time" />
</template>

<script>
import { CxTimePicker } from '@chronixjs/ui-vue2';

export default {
  components: { CxTimePicker },
  data() {
    return {
      time: undefined,
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxTimePicker } from '@chronixjs/ui-react';

export function App() {
  const [time, setTime] = useState<Date | undefined>(undefined);

  return (
    <CxTimePicker
      value={time}
      onUpdateValue={setTime}
      hourStep={2}
      minuteStep={15}
      placeholder="Stepped time"
    />
  );
}
```

:::

## 可清除

添加 `clearable` 属性让用户可以通过清除图标清除已选时间。

::: code-group

```vue [Vue 3]
<template>
  <CxTimePicker v-model:value="time" clearable placeholder="Pick and clear" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxTimePicker } from '@chronixjs/ui-vue3';

const time = ref<Date | undefined>(undefined);
</script>
```

```vue [Vue 2]
<template>
  <CxTimePicker :value.sync="time" clearable placeholder="Pick and clear" />
</template>

<script>
import { CxTimePicker } from '@chronixjs/ui-vue2';

export default {
  components: { CxTimePicker },
  data() {
    return {
      time: undefined,
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxTimePicker } from '@chronixjs/ui-react';

export function App() {
  const [time, setTime] = useState<Date | undefined>(undefined);

  return (
    <CxTimePicker value={time} onUpdateValue={setTime} clearable placeholder="Pick and clear" />
  );
}
```

:::

## API 参考

### 属性 (Props)

| 属性               | 类型                          | 默认值           | 说明                |
| ------------------ | ----------------------------- | ---------------- | ------------------- |
| `value`            | `Date \| undefined`           | `undefined`      | 选中的时间          |
| `format`           | `string`                      | `'HH:mm:ss'`     | date-fns 格式字符串 |
| `placeholder`      | `string`                      | `''`             | 占位文本            |
| `disabled`         | `boolean`                     | `false`          | 禁用选择器          |
| `clearable`        | `boolean`                     | `false`          | 显示清除图标        |
| `hourStep`         | `number`                      | `1`              | 小时步长            |
| `minuteStep`       | `number`                      | `1`              | 分钟步长            |
| `secondStep`       | `number`                      | `1`              | 秒步长              |
| `use12Hours`       | `boolean`                     | `false`          | 12 小时制           |
| `placement`        | `PopupPlacement`              | `'bottom-start'` | 面板弹出位置        |
| `isHourDisabled`   | `(hour: number) => boolean`   | `undefined`      | 禁用小时的回调函数  |
| `isMinuteDisabled` | `(minute: number) => boolean` | `undefined`      | 禁用分钟的回调函数  |
| `isSecondDisabled` | `(second: number) => boolean` | `undefined`      | 禁用秒的回调函数    |

### 事件 (Events)

| 事件           | 载荷                | 说明           |
| -------------- | ------------------- | -------------- |
| `update:value` | `Date \| undefined` | 时间变化时触发 |
