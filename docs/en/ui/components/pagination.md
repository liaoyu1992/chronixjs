# Pagination

Page navigation with ellipsis, quick jumper, and page size picker.

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
  <CxPagination v-model:page="page" :page-count="50" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxPagination } from '@chronixjs/ui-vue3';

const page = ref(1);
</script>
```

```vue [Vue 2]
<template>
  <CxPagination :page.sync="page" :page-count="50" />
</template>

<script>
import { CxPagination } from '@chronixjs/ui-vue2';

export default {
  components: { CxPagination },
  data() {
    return { page: 1 };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxPagination } from '@chronixjs/ui-react';

export function App() {
  const [page, setPage] = useState(1);

  return <CxPagination page={page} pageCount={50} onUpdatePage={setPage} />;
}
```

:::

## With Item Count

Use `item-count` and `page-size` instead of `page-count` to let the component calculate total pages automatically.

::: code-group

```vue [Vue 3]
<template>
  <CxPagination v-model:page="page" :item-count="100" :page-size="10" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxPagination } from '@chronixjs/ui-vue3';

const page = ref(1);
</script>
```

```vue [Vue 2]
<template>
  <CxPagination :page.sync="page" :item-count="100" :page-size="10" />
</template>

<script>
import { CxPagination } from '@chronixjs/ui-vue2';

export default {
  components: { CxPagination },
  data() {
    return { page: 1 };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxPagination } from '@chronixjs/ui-react';

export function App() {
  const [page, setPage] = useState(1);

  return <CxPagination page={page} itemCount={100} pageSize={10} onUpdatePage={setPage} />;
}
```

:::

## Size Picker

::: code-group

```vue [Vue 3]
<template>
  <CxPagination
    v-model:page="page"
    :page-count="50"
    :show-size-picker="true"
    :page-sizes="[10, 20, 50]"
    v-model:page-size="pageSize"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxPagination } from '@chronixjs/ui-vue3';

const page = ref(1);
const pageSize = ref(10);
</script>
```

```vue [Vue 2]
<template>
  <CxPagination
    :page.sync="page"
    :page-count="50"
    :show-size-picker="true"
    :page-sizes="[10, 20, 50]"
    :page-size.sync="pageSize"
  />
</template>

<script>
import { CxPagination } from '@chronixjs/ui-vue2';

export default {
  components: { CxPagination },
  data() {
    return {
      page: 1,
      pageSize: 10,
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxPagination } from '@chronixjs/ui-react';

export function App() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  return (
    <CxPagination
      page={page}
      pageCount={50}
      showSizePicker={true}
      pageSizes={[10, 20, 50]}
      pageSize={pageSize}
      onUpdatePage={setPage}
      onUpdatePageSize={setPageSize}
    />
  );
}
```

:::

## Quick Jumper

::: code-group

```vue [Vue 3]
<template>
  <CxPagination v-model:page="page" :page-count="50" :show-quick-jumper="true" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxPagination } from '@chronixjs/ui-vue3';

const page = ref(1);
</script>
```

```vue [Vue 2]
<template>
  <CxPagination :page.sync="page" :page-count="50" :show-quick-jumper="true" />
</template>

<script>
import { CxPagination } from '@chronixjs/ui-vue2';

export default {
  components: { CxPagination },
  data() {
    return { page: 1 };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxPagination } from '@chronixjs/ui-react';

export function App() {
  const [page, setPage] = useState(1);

  return <CxPagination page={page} pageCount={50} showQuickJumper={true} onUpdatePage={setPage} />;
}
```

:::

## Disabled

::: code-group

```vue [Vue 3]
<template>
  <CxPagination v-model:page="page" :page-count="50" :disabled="true" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxPagination } from '@chronixjs/ui-vue3';

const page = ref(1);
</script>
```

```vue [Vue 2]
<template>
  <CxPagination :page.sync="page" :page-count="50" :disabled="true" />
</template>

<script>
import { CxPagination } from '@chronixjs/ui-vue2';

export default {
  components: { CxPagination },
  data() {
    return { page: 1 };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxPagination } from '@chronixjs/ui-react';

export function App() {
  const [page, setPage] = useState(1);

  return <CxPagination page={page} pageCount={50} disabled={true} onUpdatePage={setPage} />;
}
```

:::

## API Reference

### Props

| Prop              | Type       | Default | Description                            |
| ----------------- | ---------- | ------- | -------------------------------------- |
| `page`            | `number`   | `1`     | Current page (1-based)                 |
| `pageCount`       | `number`   | `1`     | Total pages                            |
| `itemCount`       | `number`   | `0`     | Total items (alternative to pageCount) |
| `pageSize`        | `number`   | `10`    | Items per page                         |
| `pageSizes`       | `number[]` | `[10]`  | Available page sizes                   |
| `showSizePicker`  | `boolean`  | `false` | Show size picker                       |
| `showQuickJumper` | `boolean`  | `false` | Show page jumper                       |
| `pageSlot`        | `number`   | `9`     | Visible page slots                     |
| `disabled`        | `boolean`  | `false` | Disable pagination                     |

### Events

| Event         | Payload  | Description  |
| ------------- | -------- | ------------ |
| `update:page` | `number` | Page changed |
