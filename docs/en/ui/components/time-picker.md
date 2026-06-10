# Time Picker

A time selection picker with scrollable hour/minute/second columns.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

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

## Format

Customize the display format using date-fns format strings. The default is `HH:mm:ss`. Use `format="HH:mm"` to show hours and minutes only.

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

## 12-Hour Format

Set `use12-hours` to `true` to display a 12-hour clock with AM/PM toggle.

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

## Steps

Use `hour-step` and `minute-step` to jump by a fixed increment when scrolling through time columns.

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

## Clearable

Add `clearable` to let users clear the selected time with a clear icon.

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

## API Reference

### Props

| Prop               | Type                          | Default          | Description      |
| ------------------ | ----------------------------- | ---------------- | ---------------- |
| `value`            | `Date \| undefined`           | `undefined`      | Selected time    |
| `format`           | `string`                      | `'HH:mm:ss'`     | date-fns format  |
| `placeholder`      | `string`                      | `''`             | Placeholder text |
| `disabled`         | `boolean`                     | `false`          | Disable picker   |
| `clearable`        | `boolean`                     | `false`          | Show clear icon  |
| `hourStep`         | `number`                      | `1`              | Hour increment   |
| `minuteStep`       | `number`                      | `1`              | Minute increment |
| `secondStep`       | `number`                      | `1`              | Second increment |
| `use12Hours`       | `boolean`                     | `false`          | 12-hour format   |
| `placement`        | `PopupPlacement`              | `'bottom-start'` | Panel position   |
| `isHourDisabled`   | `(hour: number) => boolean`   | `undefined`      | Disable hours    |
| `isMinuteDisabled` | `(minute: number) => boolean` | `undefined`      | Disable minutes  |
| `isSecondDisabled` | `(second: number) => boolean` | `undefined`      | Disable seconds  |

### Events

| Event          | Payload             | Description  |
| -------------- | ------------------- | ------------ |
| `update:value` | `Date \| undefined` | Time changed |
