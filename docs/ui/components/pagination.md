# Pagination 分页

带省略号、快速跳转和每页条数选择器的分页导航。

## 安装

::: code-group
<<< @/snippets/vue3/install-ui.md
<<< @/snippets/vue2/install-ui.md
<<< @/snippets/react/install-ui.md
:::

## 基础用法

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

## 使用条目总数

使用 `item-count` 和 `page-size` 代替 `page-count`，让组件自动计算总页数。

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

## 每页条数选择器

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

## 快速跳转

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

## 禁用状态

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

## API 参考

### 属性 (Props)

| 属性              | 类型       | 默认值  | 说明                             |
| ----------------- | ---------- | ------- | -------------------------------- |
| `page`            | `number`   | `1`     | 当前页码（从 1 开始）            |
| `pageCount`       | `number`   | `1`     | 总页数                           |
| `itemCount`       | `number`   | `0`     | 总条目数（pageCount 的替代方案） |
| `pageSize`        | `number`   | `10`    | 每页条数                         |
| `pageSizes`       | `number[]` | `[10]`  | 可选的每页条数                   |
| `showSizePicker`  | `boolean`  | `false` | 显示每页条数选择器               |
| `showQuickJumper` | `boolean`  | `false` | 显示快速跳转                     |
| `pageSlot`        | `number`   | `9`     | 可见的页码槽位数                 |
| `disabled`        | `boolean`  | `false` | 禁用分页                         |

### 事件 (Events)

| 事件          | 载荷     | 说明     |
| ------------- | -------- | -------- |
| `update:page` | `number` | 页码变化 |
