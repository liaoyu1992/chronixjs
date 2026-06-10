# Upload 上传

带有状态追踪和进度显示的文件上传组件。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## 基础用法

指向上传端点的简单文件上传组件。

::: code-group

```vue [Vue 3]
<template>
  <CxUpload action="/api/upload" :file-list="fileList" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxUpload } from '@chronixjs/ui-vue3';

const fileList = ref([]);
</script>
```

```vue [Vue 2]
<template>
  <CxUpload action="/api/upload" :file-list="fileList" />
</template>

<script>
import { CxUpload } from '@chronixjs/ui-vue2';

export default {
  components: { CxUpload },
  data() {
    return {
      fileList: [],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxUpload } from '@chronixjs/ui-react';

export function App() {
  const [fileList, setFileList] = useState([]);

  return <CxUpload action="/api/upload" fileList={fileList} />;
}
```

:::

## 多文件上传

使用 `multiple` 属性允许一次选择并上传多个文件。

::: code-group

```vue [Vue 3]
<template>
  <CxUpload action="/api/upload" :file-list="fileList" multiple />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxUpload } from '@chronixjs/ui-vue3';

const fileList = ref([]);
</script>
```

```vue [Vue 2]
<template>
  <CxUpload action="/api/upload" :file-list="fileList" multiple />
</template>

<script>
import { CxUpload } from '@chronixjs/ui-vue2';

export default {
  components: { CxUpload },
  data() {
    return {
      fileList: [],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxUpload } from '@chronixjs/ui-react';

export function App() {
  const [fileList, setFileList] = useState([]);

  return <CxUpload action="/api/upload" fileList={fileList} multiple />;
}
```

:::

## 限制文件类型

使用 `accept` 属性限制可选择的文件类型。支持 MIME 类型或扩展名。

::: code-group

```vue [Vue 3]
<template>
  <CxUpload action="/api/upload" :file-list="fileList" accept="image/*" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxUpload } from '@chronixjs/ui-vue3';

const fileList = ref([]);
</script>
```

```vue [Vue 2]
<template>
  <CxUpload action="/api/upload" :file-list="fileList" accept="image/*" />
</template>

<script>
import { CxUpload } from '@chronixjs/ui-vue2';

export default {
  components: { CxUpload },
  data() {
    return {
      fileList: [],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxUpload } from '@chronixjs/ui-react';

export function App() {
  const [fileList, setFileList] = useState([]);

  return <CxUpload action="/api/upload" fileList={fileList} accept="image/*" />;
}
```

:::

## 目录上传

使用 `directory` 属性启用目录选择以上传整个文件夹。

::: code-group

```vue [Vue 3]
<template>
  <CxUpload action="/api/upload" :file-list="fileList" directory />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxUpload } from '@chronixjs/ui-vue3';

const fileList = ref([]);
</script>
```

```vue [Vue 2]
<template>
  <CxUpload action="/api/upload" :file-list="fileList" directory />
</template>

<script>
import { CxUpload } from '@chronixjs/ui-vue2';

export default {
  components: { CxUpload },
  data() {
    return {
      fileList: [],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxUpload } from '@chronixjs/ui-react';

export function App() {
  const [fileList, setFileList] = useState([]);

  return <CxUpload action="/api/upload" fileList={fileList} directory />;
}
```

:::

## API 参考

### 属性 (Props)

| 属性        | 类型               | 默认值      | 说明           |
| ----------- | ------------------ | ----------- | -------------- |
| `action`    | `string`           | `undefined` | 上传端点 URL   |
| `fileList`  | `UploadFileInfo[]` | `[]`        | 受控的文件列表 |
| `accept`    | `string`           | `undefined` | 接受的文件类型 |
| `multiple`  | `boolean`          | `false`     | 允许多文件上传 |
| `directory` | `boolean`          | `false`     | 允许目录上传   |
| `disabled`  | `boolean`          | `false`     | 禁用上传       |

### UploadFileInfo 接口

| 字段         | 类型                                                             | 说明               |
| ------------ | ---------------------------------------------------------------- | ------------------ |
| `id`         | `string`                                                         | 唯一文件 ID        |
| `name`       | `string`                                                         | 文件名             |
| `status`     | `'pending' \| 'uploading' \| 'finished' \| 'error' \| 'removed'` | 上传状态           |
| `percentage` | `number`                                                         | 上传进度（0-100）  |
| `url`        | `string`                                                         | 文件 URL（上传后） |
| `file`       | `File`                                                           | 原生 File 对象     |
