# Dropdown

A popup menu triggered by hover, click, or focus with keyboard navigation.

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
  <CxDropdown :options="options" @select="onSelect">
    <CxButton>Dropdown</CxButton>
  </CxDropdown>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxDropdown, CxButton } from '@chronixjs/ui-vue3';

const options = ref([
  { key: '1', label: 'Option 1', value: 'opt1' },
  { key: '2', label: 'Option 2', value: 'opt2' },
  { key: '3', label: 'Option 3', value: 'opt3' },
]);

function onSelect(option: { key: string; label: string; value: string }) {
  console.log('Selected:', option);
}
</script>
```

```vue [Vue 2]
<template>
  <CxDropdown :options="options" @select="onSelect">
    <CxButton>Dropdown</CxButton>
  </CxDropdown>
</template>

<script>
import { CxDropdown, CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxDropdown, CxButton },
  data() {
    return {
      options: [
        { key: '1', label: 'Option 1', value: 'opt1' },
        { key: '2', label: 'Option 2', value: 'opt2' },
        { key: '3', label: 'Option 3', value: 'opt3' },
      ],
    };
  },
  methods: {
    onSelect(option) {
      console.log('Selected:', option);
    },
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxDropdown, CxButton } from '@chronixjs/ui-react';

export function App() {
  const [options] = useState([
    { key: '1', label: 'Option 1', value: 'opt1' },
    { key: '2', label: 'Option 2', value: 'opt2' },
    { key: '3', label: 'Option 3', value: 'opt3' },
  ]);

  function onSelect(option: { key: string; label: string; value: string }) {
    console.log('Selected:', option);
  }

  return (
    <CxDropdown options={options} onSelect={onSelect}>
      <CxButton>Dropdown</CxButton>
    </CxDropdown>
  );
}
```

:::

## Trigger Modes

Use the `trigger` prop to control how the dropdown opens. The default is `click`.

### Click Trigger (default)

::: code-group

```vue [Vue 3]
<template>
  <CxDropdown :options="options" trigger="click" @select="onSelect">
    <CxButton>Click to Open</CxButton>
  </CxDropdown>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxDropdown, CxButton } from '@chronixjs/ui-vue3';

const options = ref([
  { key: '1', label: 'Edit', value: 'edit' },
  { key: '2', label: 'Delete', value: 'delete' },
]);

function onSelect(option: { key: string; label: string; value: string }) {
  console.log('Selected:', option);
}
</script>
```

```vue [Vue 2]
<template>
  <CxDropdown :options="options" trigger="click" @select="onSelect">
    <CxButton>Click to Open</CxButton>
  </CxDropdown>
</template>

<script>
import { CxDropdown, CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxDropdown, CxButton },
  data() {
    return {
      options: [
        { key: '1', label: 'Edit', value: 'edit' },
        { key: '2', label: 'Delete', value: 'delete' },
      ],
    };
  },
  methods: {
    onSelect(option) {
      console.log('Selected:', option);
    },
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxDropdown, CxButton } from '@chronixjs/ui-react';

export function App() {
  const [options] = useState([
    { key: '1', label: 'Edit', value: 'edit' },
    { key: '2', label: 'Delete', value: 'delete' },
  ]);

  function onSelect(option: { key: string; label: string; value: string }) {
    console.log('Selected:', option);
  }

  return (
    <CxDropdown options={options} trigger="click" onSelect={onSelect}>
      <CxButton>Click to Open</CxButton>
    </CxDropdown>
  );
}
```

:::

### Hover Trigger

::: code-group

```vue [Vue 3]
<template>
  <CxDropdown :options="options" trigger="hover" @select="onSelect">
    <CxButton>Hover to Open</CxButton>
  </CxDropdown>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxDropdown, CxButton } from '@chronixjs/ui-vue3';

const options = ref([
  { key: '1', label: 'Profile', value: 'profile' },
  { key: '2', label: 'Settings', value: 'settings' },
  { key: '3', label: 'Logout', value: 'logout' },
]);

function onSelect(option: { key: string; label: string; value: string }) {
  console.log('Selected:', option);
}
</script>
```

```vue [Vue 2]
<template>
  <CxDropdown :options="options" trigger="hover" @select="onSelect">
    <CxButton>Hover to Open</CxButton>
  </CxDropdown>
</template>

<script>
import { CxDropdown, CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxDropdown, CxButton },
  data() {
    return {
      options: [
        { key: '1', label: 'Profile', value: 'profile' },
        { key: '2', label: 'Settings', value: 'settings' },
        { key: '3', label: 'Logout', value: 'logout' },
      ],
    };
  },
  methods: {
    onSelect(option) {
      console.log('Selected:', option);
    },
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxDropdown, CxButton } from '@chronixjs/ui-react';

export function App() {
  const [options] = useState([
    { key: '1', label: 'Profile', value: 'profile' },
    { key: '2', label: 'Settings', value: 'settings' },
    { key: '3', label: 'Logout', value: 'logout' },
  ]);

  function onSelect(option: { key: string; label: string; value: string }) {
    console.log('Selected:', option);
  }

  return (
    <CxDropdown options={options} trigger="hover" onSelect={onSelect}>
      <CxButton>Hover to Open</CxButton>
    </CxDropdown>
  );
}
```

:::

## Placements

The dropdown popup supports 12 placement positions. The default is `bottom-start`.

Available placements: `top`, `top-start`, `top-end`, `bottom`, `bottom-start`, `bottom-end`, `left`, `left-start`, `left-end`, `right`, `right-start`, `right-end`.

::: code-group

```vue [Vue 3]
<template>
  <CxDropdown :options="options" placement="top" @select="onSelect">
    <CxButton>Top Placement</CxButton>
  </CxDropdown>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxDropdown, CxButton } from '@chronixjs/ui-vue3';

const options = ref([
  { key: '1', label: 'Option 1', value: 'opt1' },
  { key: '2', label: 'Option 2', value: 'opt2' },
]);

function onSelect(option: { key: string; label: string; value: string }) {
  console.log('Selected:', option);
}
</script>
```

```vue [Vue 2]
<template>
  <CxDropdown :options="options" placement="top" @select="onSelect">
    <CxButton>Top Placement</CxButton>
  </CxDropdown>
</template>

<script>
import { CxDropdown, CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxDropdown, CxButton },
  data() {
    return {
      options: [
        { key: '1', label: 'Option 1', value: 'opt1' },
        { key: '2', label: 'Option 2', value: 'opt2' },
      ],
    };
  },
  methods: {
    onSelect(option) {
      console.log('Selected:', option);
    },
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxDropdown, CxButton } from '@chronixjs/ui-react';

export function App() {
  const [options] = useState([
    { key: '1', label: 'Option 1', value: 'opt1' },
    { key: '2', label: 'Option 2', value: 'opt2' },
  ]);

  function onSelect(option: { key: string; label: string; value: string }) {
    console.log('Selected:', option);
  }

  return (
    <CxDropdown options={options} placement="top" onSelect={onSelect}>
      <CxButton>Top Placement</CxButton>
    </CxDropdown>
  );
}
```

:::

## Disabled

::: code-group

```vue [Vue 3]
<template>
  <CxDropdown :options="options" disabled>
    <CxButton disabled>Disabled</CxButton>
  </CxDropdown>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxDropdown, CxButton } from '@chronixjs/ui-vue3';

const options = ref([{ key: '1', label: 'Option 1', value: 'opt1' }]);
</script>
```

```vue [Vue 2]
<template>
  <CxDropdown :options="options" disabled>
    <CxButton disabled>Disabled</CxButton>
  </CxDropdown>
</template>

<script>
import { CxDropdown, CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxDropdown, CxButton },
  data() {
    return {
      options: [{ key: '1', label: 'Option 1', value: 'opt1' }],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxDropdown, CxButton } from '@chronixjs/ui-react';

export function App() {
  const [options] = useState([{ key: '1', label: 'Option 1', value: 'opt1' }]);

  return (
    <CxDropdown options={options} disabled>
      <CxButton disabled>Disabled</CxButton>
    </CxDropdown>
  );
}
```

:::

## API Reference

### Props

| Prop        | Type                                        | Default          | Description           |
| ----------- | ------------------------------------------- | ---------------- | --------------------- |
| `show`      | `boolean`                                   | `undefined`      | Controlled visibility |
| `trigger`   | `'hover' \| 'click' \| 'focus' \| 'manual'` | `'click'`        | Trigger mode          |
| `placement` | `PopupPlacement`                            | `'bottom-start'` | Popup position        |
| `options`   | `DropdownOption[]`                          | `[]`             | Option list           |
| `disabled`  | `boolean`                                   | `false`          | Disable dropdown      |

### Events

| Event         | Payload          | Description        |
| ------------- | ---------------- | ------------------ |
| `update:show` | `boolean`        | Visibility changed |
| `select`      | `DropdownOption` | Option selected    |

### Slots

| Slot      | Description     |
| --------- | --------------- |
| `default` | Trigger element |
