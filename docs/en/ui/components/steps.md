# Steps

A wizard-style step indicator showing progress through a multi-stage process.

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
  <div>
    <CxSteps :items="items" :current="current" />
    <div style="margin-top: 16px;">
      <CxButton @click="current = Math.max(current - 1, 0)">Previous</CxButton>
      <CxButton @click="current = Math.min(current + 1, 2)" style="margin-left: 8px;"
        >Next</CxButton
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxSteps } from '@chronixjs/ui-vue3';
import { CxButton } from '@chronixjs/ui-vue3';

const current = ref(0);
const items = [
  { key: '1', title: 'Account', description: 'Create your account' },
  { key: '2', title: 'Profile', description: 'Fill in your profile' },
  { key: '3', title: 'Complete', description: 'All done' },
];
</script>
```

```vue [Vue 2]
<template>
  <div>
    <CxSteps :items="items" :current="current" />
    <div style="margin-top: 16px;">
      <CxButton @click="current = Math.max(current - 1, 0)">Previous</CxButton>
      <CxButton @click="current = Math.min(current + 1, 2)" style="margin-left: 8px;"
        >Next</CxButton
      >
    </div>
  </div>
</template>

<script>
import { CxSteps } from '@chronixjs/ui-vue2';
import { CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxSteps, CxButton },
  data() {
    return {
      current: 0,
      items: [
        { key: '1', title: 'Account', description: 'Create your account' },
        { key: '2', title: 'Profile', description: 'Fill in your profile' },
        { key: '3', title: 'Complete', description: 'All done' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxSteps } from '@chronixjs/ui-react';
import { CxButton } from '@chronixjs/ui-react';

const items = [
  { key: '1', title: 'Account', description: 'Create your account' },
  { key: '2', title: 'Profile', description: 'Fill in your profile' },
  { key: '3', title: 'Complete', description: 'All done' },
];

export function App() {
  const [current, setCurrent] = useState(0);

  return (
    <div>
      <CxSteps items={items} current={current} />
      <div style={{ marginTop: 16 }}>
        <CxButton onClick={() => setCurrent(Math.max(current - 1, 0))}>Previous</CxButton>
        <CxButton onClick={() => setCurrent(Math.min(current + 1, 2))} style={{ marginLeft: 8 }}>
          Next
        </CxButton>
      </div>
    </div>
  );
}
```

:::

## Vertical Direction

Use `direction="vertical"` to render the steps in a vertical layout.

::: code-group

```vue [Vue 3]
<template>
  <CxSteps :items="items" :current="current" direction="vertical" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxSteps } from '@chronixjs/ui-vue3';

const current = ref(1);
const items = [
  { key: '1', title: 'Account', description: 'Create your account' },
  { key: '2', title: 'Profile', description: 'Fill in your profile' },
  { key: '3', title: 'Complete', description: 'All done' },
];
</script>
```

```vue [Vue 2]
<template>
  <CxSteps :items="items" :current="current" direction="vertical" />
</template>

<script>
import { CxSteps } from '@chronixjs/ui-vue2';

export default {
  components: { CxSteps },
  data() {
    return {
      current: 1,
      items: [
        { key: '1', title: 'Account', description: 'Create your account' },
        { key: '2', title: 'Profile', description: 'Fill in your profile' },
        { key: '3', title: 'Complete', description: 'All done' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxSteps } from '@chronixjs/ui-react';

const items = [
  { key: '1', title: 'Account', description: 'Create your account' },
  { key: '2', title: 'Profile', description: 'Fill in your profile' },
  { key: '3', title: 'Complete', description: 'All done' },
];

export function App() {
  const [current, setCurrent] = useState(1);

  return <CxSteps items={items} current={current} direction="vertical" />;
}
```

:::

## Error Step

Override an individual step's status by setting `status: 'error'` on the step item. This is useful to highlight a failed step.

::: code-group

```vue [Vue 3]
<template>
  <CxSteps :items="items" :current="1" />
</template>

<script setup lang="ts">
import { CxSteps } from '@chronixjs/ui-vue3';

const items = [
  { key: '1', title: 'Account', description: 'Create your account', status: 'finish' },
  { key: '2', title: 'Profile', description: 'Fill in your profile', status: 'error' },
  { key: '3', title: 'Complete', description: 'All done', status: 'wait' },
];
</script>
```

```vue [Vue 2]
<template>
  <CxSteps :items="items" :current="1" />
</template>

<script>
import { CxSteps } from '@chronixjs/ui-vue2';

export default {
  components: { CxSteps },
  data() {
    return {
      items: [
        { key: '1', title: 'Account', description: 'Create your account', status: 'finish' },
        { key: '2', title: 'Profile', description: 'Fill in your profile', status: 'error' },
        { key: '3', title: 'Complete', description: 'All done', status: 'wait' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { CxSteps } from '@chronixjs/ui-react';

const items = [
  { key: '1', title: 'Account', description: 'Create your account', status: 'finish' },
  { key: '2', title: 'Profile', description: 'Fill in your profile', status: 'error' },
  { key: '3', title: 'Complete', description: 'All done', status: 'wait' },
];

export function App() {
  return <CxSteps items={items} current={1} />;
}
```

:::

## API Reference

### Props

| Prop        | Type                         | Default        | Description                 |
| ----------- | ---------------------------- | -------------- | --------------------------- |
| `items`     | `StepItem[]`                 | `[]`           | Step definitions            |
| `current`   | `number`                     | `0`            | Active step index (0-based) |
| `direction` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout direction            |

### StepItem Interface

| Field         | Type                                         | Description      |
| ------------- | -------------------------------------------- | ---------------- |
| `key`         | `string`                                     | Unique key       |
| `title`       | `string`                                     | Step title       |
| `description` | `string`                                     | Step description |
| `status`      | `'wait' \| 'process' \| 'finish' \| 'error'` | Override status  |
