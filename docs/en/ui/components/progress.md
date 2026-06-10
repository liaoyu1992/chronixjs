# Progress

A linear progress bar with semantic types and configurable display.

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
  <div style="display: flex; flex-direction: column; gap: 12px;">
    <CxProgress :percentage="30" />
    <CxProgress :percentage="60" type="success" />
    <CxProgress :percentage="100" type="warning" />
  </div>
</template>

<script setup lang="ts">
import { CxProgress } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; flex-direction: column; gap: 12px;">
    <CxProgress :percentage="30" />
    <CxProgress :percentage="60" type="success" />
    <CxProgress :percentage="100" type="warning" />
  </div>
</template>

<script>
import { CxProgress } from '@chronixjs/ui-vue2';

export default {
  components: { CxProgress },
};
</script>
```

```tsx [React]
import { CxProgress } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <CxProgress percentage={30} />
      <CxProgress percentage={60} type="success" />
      <CxProgress percentage={100} type="warning" />
    </div>
  );
}
```

:::

## Progress Types

Use `type` to apply semantic coloring: `default`, `success`, `warning`, `error`, or `info`.

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; flex-direction: column; gap: 12px;">
    <CxProgress :percentage="20" type="default" />
    <CxProgress :percentage="40" type="success" />
    <CxProgress :percentage="60" type="warning" />
    <CxProgress :percentage="80" type="error" />
    <CxProgress :percentage="90" type="info" />
  </div>
</template>

<script setup lang="ts">
import { CxProgress } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; flex-direction: column; gap: 12px;">
    <CxProgress :percentage="20" type="default" />
    <CxProgress :percentage="40" type="success" />
    <CxProgress :percentage="60" type="warning" />
    <CxProgress :percentage="80" type="error" />
    <CxProgress :percentage="90" type="info" />
  </div>
</template>

<script>
import { CxProgress } from '@chronixjs/ui-vue2';

export default {
  components: { CxProgress },
};
</script>
```

```tsx [React]
import { CxProgress } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <CxProgress percentage={20} type="default" />
      <CxProgress percentage={40} type="success" />
      <CxProgress percentage={60} type="warning" />
      <CxProgress percentage={80} type="error" />
      <CxProgress percentage={90} type="info" />
    </div>
  );
}
```

:::

## Indicator Placement

Control where the percentage text appears. By default the indicator is placed **outside** the bar. Set `indicator-placement="inside"` to render it within the filled area.

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; flex-direction: column; gap: 12px;">
    <CxProgress :percentage="70" indicator-placement="outside" />
    <CxProgress :percentage="70" indicator-placement="inside" :height="24" />
  </div>
</template>

<script setup lang="ts">
import { CxProgress } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; flex-direction: column; gap: 12px;">
    <CxProgress :percentage="70" indicator-placement="outside" />
    <CxProgress :percentage="70" indicator-placement="inside" :height="24" />
  </div>
</template>

<script>
import { CxProgress } from '@chronixjs/ui-vue2';

export default {
  components: { CxProgress },
};
</script>
```

```tsx [React]
import { CxProgress } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <CxProgress percentage={70} indicatorPlacement="outside" />
      <CxProgress percentage={70} indicatorPlacement="inside" height={24} />
    </div>
  );
}
```

:::

## Custom Height

Set the `height` prop (in pixels) to create a thicker or thinner bar.

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; flex-direction: column; gap: 16px;">
    <CxProgress :percentage="50" :height="8" />
    <CxProgress :percentage="50" :height="16" />
    <CxProgress :percentage="50" :height="24" />
  </div>
</template>

<script setup lang="ts">
import { CxProgress } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; flex-direction: column; gap: 16px;">
    <CxProgress :percentage="50" :height="8" />
    <CxProgress :percentage="50" :height="16" />
    <CxProgress :percentage="50" :height="24" />
  </div>
</template>

<script>
import { CxProgress } from '@chronixjs/ui-vue2';

export default {
  components: { CxProgress },
};
</script>
```

```tsx [React]
import { CxProgress } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <CxProgress percentage={50} height={8} />
      <CxProgress percentage={50} height={16} />
      <CxProgress percentage={50} height={24} />
    </div>
  );
}
```

:::

## Without Info

Hide the percentage text by setting `show-info` to `false`.

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; flex-direction: column; gap: 12px;">
    <CxProgress :percentage="40" :show-info="false" />
    <CxProgress :percentage="75" :show-info="false" type="success" />
  </div>
</template>

<script setup lang="ts">
import { CxProgress } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; flex-direction: column; gap: 12px;">
    <CxProgress :percentage="40" :show-info="false" />
    <CxProgress :percentage="75" :show-info="false" type="success" />
  </div>
</template>

<script>
import { CxProgress } from '@chronixjs/ui-vue2';

export default {
  components: { CxProgress },
};
</script>
```

```tsx [React]
import { CxProgress } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <CxProgress percentage={40} showInfo={false} />
      <CxProgress percentage={75} showInfo={false} type="success" />
    </div>
  );
}
```

:::

## API Reference

### Props

| Prop                 | Type                                                       | Default     | Description            |
| -------------------- | ---------------------------------------------------------- | ----------- | ---------------------- |
| `type`               | `'default' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'default'` | Progress type          |
| `percentage`         | `number`                                                   | `0`         | Progress value (0-100) |
| `showInfo`           | `boolean`                                                  | `true`      | Show percentage text   |
| `height`             | `number`                                                   | `undefined` | Rail height in px      |
| `indicatorPlacement` | `'inside' \| 'outside'`                                    | `'outside'` | Text placement         |
