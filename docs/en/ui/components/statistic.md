# Statistic

Numeric display for dashboards and KPI summaries with optional prefix/suffix.

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
  <CxStatistic label="Total Users" :value="12345" />
</template>

<script setup lang="ts">
import { CxStatistic } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxStatistic label="Total Users" :value="12345" />
</template>

<script>
import { CxStatistic } from '@chronixjs/ui-vue2';
export default { components: { CxStatistic } };
</script>
```

```tsx [React]
import { CxStatistic } from '@chronixjs/ui-react';

export function App() {
  return <CxStatistic label="Total Users" value={12345} />;
}
```

:::

## With Precision

::: code-group

```vue [Vue 3]
<template>
  <CxStatistic label="Conversion Rate" :value="0.8563" :precision="2" />
</template>

<script setup lang="ts">
import { CxStatistic } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxStatistic label="Conversion Rate" :value="0.8563" :precision="2" />
</template>

<script>
import { CxStatistic } from '@chronixjs/ui-vue2';
export default { components: { CxStatistic } };
</script>
```

```tsx [React]
import { CxStatistic } from '@chronixjs/ui-react';

export function App() {
  return <CxStatistic label="Conversion Rate" value={0.8563} precision={2} />;
}
```

:::

## With Prefix and Suffix

::: code-group

```vue [Vue 3]
<template>
  <CxStatistic label="Revenue" :value="99999">
    <template #prefix>$</template>
    <template #suffix>USD</template>
  </CxStatistic>
</template>

<script setup lang="ts">
import { CxStatistic } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxStatistic label="Revenue" :value="99999">
    <template slot="prefix">$</template>
    <template slot="suffix">USD</template>
  </CxStatistic>
</template>

<script>
import { CxStatistic } from '@chronixjs/ui-vue2';
export default { components: { CxStatistic } };
</script>
```

```tsx [React]
import { CxStatistic } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxStatistic label="Revenue" value={99999} prefix={<span>$</span>} suffix={<span>USD</span>} />
  );
}
```

:::

## API Reference

### Props

| Prop          | Type                            | Default     | Description                                    |
| ------------- | ------------------------------- | ----------- | ---------------------------------------------- |
| `label`       | `string \| undefined`           | `undefined` | Heading label above the value                  |
| `value`       | `number \| string \| undefined` | `undefined` | Display value; numbers pass through formatting |
| `precision`   | `number \| undefined`           | `undefined` | Decimal precision for numeric values           |
| `tabularNums` | `boolean`                       | `true`      | Use `tabular-nums` for aligned digit widths    |

### Slots

| Slot     | Description                       |
| -------- | --------------------------------- |
| `prefix` | Content rendered before the value |
| `suffix` | Content rendered after the value  |
