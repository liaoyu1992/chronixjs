<script setup>
import StatisticBasic from '../../../ui/components/demos/statistic/StatisticBasic.vue';
import statisticBasicCode from '../../../ui/components/demos/statistic/StatisticBasic.vue?raw';
import statisticBasicVue2 from '../../../ui/components/demos/statistic/StatisticBasic.vue2?raw';
import statisticBasicReact from '../../../ui/components/demos/statistic/StatisticBasic.react?raw';
</script>

# Statistic

Numeric display for dashboards and KPI summaries with optional prefix/suffix.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Display a labeled numeric value." :code="statisticBasicCode" :code-vue2="statisticBasicVue2" :code-react="statisticBasicReact">
  <StatisticBasic />
</DemoBox>

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
