# Heatmap

SVG cell grid with linear color interpolation between two endpoint colors.

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
  <CxHeatmap :cells="cells" :cell-size="20" color-low="#dbeafe" color-high="#1e3a8a" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxHeatmap } from '@chronixjs/ui-vue3';

const cells = ref([
  [1, 3, 5, 7],
  [2, 4, 6, 8],
  [0, 1, 9, 10],
]);
</script>
```

```vue [Vue 2]
<template>
  <CxHeatmap :cells="cells" :cell-size="20" color-low="#dbeafe" color-high="#1e3a8a" />
</template>

<script>
import { CxHeatmap } from '@chronixjs/ui-vue2';
export default {
  components: { CxHeatmap },
  data() {
    return {
      cells: [
        [1, 3, 5, 7],
        [2, 4, 6, 8],
        [0, 1, 9, 10],
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxHeatmap } from '@chronixjs/ui-react';

export function App() {
  const [cells] = useState([
    [1, 3, 5, 7],
    [2, 4, 6, 8],
    [0, 1, 9, 10],
  ]);

  return <CxHeatmap cells={cells} cellSize={20} colorLow="#dbeafe" colorHigh="#1e3a8a" />;
}
```

:::

## API Reference

### Props

| Prop        | Type                             | Default     | Description                 |
| ----------- | -------------------------------- | ----------- | --------------------------- |
| `cells`     | `readonly (readonly number[])[]` | `[]`        | 2D matrix of numeric values |
| `cellSize`  | `number`                         | `20`        | Cell width + height in px   |
| `colorLow`  | `string`                         | `'#dbeafe'` | Color for min value         |
| `colorHigh` | `string`                         | `'#1e3a8a'` | Color for max value         |
