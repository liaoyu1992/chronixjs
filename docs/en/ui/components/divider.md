# Divider

A visual separator line with optional title.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

A simple horizontal divider between content blocks.

::: code-group

```vue [Vue 3]
<template>
  <div>
    <p>Content above the divider.</p>
    <CxDivider />
    <p>Content below the divider.</p>
  </div>
</template>

<script setup lang="ts">
import { CxDivider } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div>
    <p>Content above the divider.</p>
    <CxDivider />
    <p>Content below the divider.</p>
  </div>
</template>

<script>
import { CxDivider } from '@chronixjs/ui-vue2';

export default {
  components: { CxDivider },
};
</script>
```

```tsx [React]
import { CxDivider } from '@chronixjs/ui-react';

export function App() {
  return (
    <div>
      <p>Content above the divider.</p>
      <CxDivider />
      <p>Content below the divider.</p>
    </div>
  );
}
```

:::

## With Title

Place text inside the divider using the default slot. Use `title-placement` to control alignment.

### Left

::: code-group

```vue [Vue 3]
<template>
  <div>
    <p>Section A content.</p>
    <CxDivider title-placement="left">Section B</CxDivider>
    <p>Section B content.</p>
  </div>
</template>

<script setup lang="ts">
import { CxDivider } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div>
    <p>Section A content.</p>
    <CxDivider title-placement="left">Section B</CxDivider>
    <p>Section B content.</p>
  </div>
</template>

<script>
import { CxDivider } from '@chronixjs/ui-vue2';

export default {
  components: { CxDivider },
};
</script>
```

```tsx [React]
import { CxDivider } from '@chronixjs/ui-react';

export function App() {
  return (
    <div>
      <p>Section A content.</p>
      <CxDivider titlePlacement="left">Section B</CxDivider>
      <p>Section B content.</p>
    </div>
  );
}
```

:::

### Center

::: code-group

```vue [Vue 3]
<template>
  <div>
    <p>Section A content.</p>
    <CxDivider title-placement="center">Details</CxDivider>
    <p>Details content.</p>
  </div>
</template>

<script setup lang="ts">
import { CxDivider } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div>
    <p>Section A content.</p>
    <CxDivider title-placement="center">Details</CxDivider>
    <p>Details content.</p>
  </div>
</template>

<script>
import { CxDivider } from '@chronixjs/ui-vue2';

export default {
  components: { CxDivider },
};
</script>
```

```tsx [React]
import { CxDivider } from '@chronixjs/ui-react';

export function App() {
  return (
    <div>
      <p>Section A content.</p>
      <CxDivider titlePlacement="center">Details</CxDivider>
      <p>Details content.</p>
    </div>
  );
}
```

:::

### Right

::: code-group

```vue [Vue 3]
<template>
  <div>
    <p>Main content.</p>
    <CxDivider title-placement="right">Extras</CxDivider>
    <p>Extra content.</p>
  </div>
</template>

<script setup lang="ts">
import { CxDivider } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div>
    <p>Main content.</p>
    <CxDivider title-placement="right">Extras</CxDivider>
    <p>Extra content.</p>
  </div>
</template>

<script>
import { CxDivider } from '@chronixjs/ui-vue2';

export default {
  components: { CxDivider },
};
</script>
```

```tsx [React]
import { CxDivider } from '@chronixjs/ui-react';

export function App() {
  return (
    <div>
      <p>Main content.</p>
      <CxDivider titlePlacement="right">Extras</CxDivider>
      <p>Extra content.</p>
    </div>
  );
}
```

:::

## Vertical

Use `vertical` to render a vertical divider between inline elements.

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; align-items: center; gap: 8px;">
    <span>Link A</span>
    <CxDivider vertical />
    <span>Link B</span>
    <CxDivider vertical />
    <span>Link C</span>
  </div>
</template>

<script setup lang="ts">
import { CxDivider } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; align-items: center; gap: 8px;">
    <span>Link A</span>
    <CxDivider vertical />
    <span>Link B</span>
    <CxDivider vertical />
    <span>Link C</span>
  </div>
</template>

<script>
import { CxDivider } from '@chronixjs/ui-vue2';

export default {
  components: { CxDivider },
};
</script>
```

```tsx [React]
import { CxDivider } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span>Link A</span>
      <CxDivider vertical />
      <span>Link B</span>
      <CxDivider vertical />
      <span>Link C</span>
    </div>
  );
}
```

:::

## Dashed

Use `dashed` to render a dashed line instead of solid.

::: code-group

```vue [Vue 3]
<template>
  <div>
    <p>Content above.</p>
    <CxDivider dashed />
    <p>Content below.</p>
  </div>
</template>

<script setup lang="ts">
import { CxDivider } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div>
    <p>Content above.</p>
    <CxDivider dashed />
    <p>Content below.</p>
  </div>
</template>

<script>
import { CxDivider } from '@chronixjs/ui-vue2';

export default {
  components: { CxDivider },
};
</script>
```

```tsx [React]
import { CxDivider } from '@chronixjs/ui-react';

export function App() {
  return (
    <div>
      <p>Content above.</p>
      <CxDivider dashed />
      <p>Content below.</p>
    </div>
  );
}
```

:::

## API Reference

### Props

| Prop             | Type                            | Default    | Description       |
| ---------------- | ------------------------------- | ---------- | ----------------- |
| `vertical`       | `boolean`                       | `false`    | Vertical divider  |
| `titlePlacement` | `'left' \| 'center' \| 'right'` | `'center'` | Title position    |
| `dashed`         | `boolean`                       | `false`    | Dashed line style |

### Slots

| Slot      | Description           |
| --------- | --------------------- |
| `default` | Divider title content |
