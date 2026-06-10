# Calendar

Standalone calendar (always visible, no popup) for date selection.

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

## Disabled Dates

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

## API Reference

### Props

| Prop             | Type                      | Default     | Description                        |
| ---------------- | ------------------------- | ----------- | ---------------------------------- |
| `value`          | `Date \| undefined`       | `undefined` | Currently selected date            |
| `disabled`       | `boolean`                 | `false`     | Disable the entire calendar        |
| `isDateDisabled` | `(date: Date) => boolean` | `undefined` | Callback to disable specific dates |

### Events

| Event          | Payload             | Description                   |
| -------------- | ------------------- | ----------------------------- |
| `update:value` | `Date \| undefined` | Fires when a date is selected |
