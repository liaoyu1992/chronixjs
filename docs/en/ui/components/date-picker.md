# Date Picker

A date selection calendar with format control and date disabling.

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

## Format

Customize the display format using date-fns format strings. The default is `yyyy-MM-dd`.

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

## Disabled Dates

Use the `isDateDisabled` callback to prevent selecting specific dates. The example below disables all weekends.

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

## Clearable

Add `clearable` to let users clear the selected date.

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

## API Reference

### Props

| Prop             | Type                      | Default          | Description              |
| ---------------- | ------------------------- | ---------------- | ------------------------ |
| `value`          | `Date \| undefined`       | `undefined`      | Selected date            |
| `format`         | `string`                  | `'yyyy-MM-dd'`   | date-fns format string   |
| `placeholder`    | `string`                  | `''`             | Placeholder text         |
| `disabled`       | `boolean`                 | `false`          | Disable picker           |
| `clearable`      | `boolean`                 | `false`          | Show clear icon          |
| `placement`      | `PopupPlacement`          | `'bottom-start'` | Calendar position        |
| `firstDayOfWeek` | `number`                  | `0`              | First day (0=Sun, 1=Mon) |
| `isDateDisabled` | `(date: Date) => boolean` | `undefined`      | Date disable callback    |

### Events

| Event          | Payload             | Description  |
| -------------- | ------------------- | ------------ |
| `update:value` | `Date \| undefined` | Date changed |
