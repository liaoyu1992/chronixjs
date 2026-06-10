# Upload

File upload component with status tracking and progress display.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

A simple file upload component pointing to an upload endpoint.

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

## Multiple Files

Use the `multiple` prop to allow selecting and uploading multiple files at once.

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

## Accept File Types

Restrict selectable file types with the `accept` prop. Use MIME types or extensions.

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

## Directory Upload

Enable directory selection with the `directory` prop to upload entire folders.

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

## API Reference

### Props

| Prop        | Type               | Default     | Description            |
| ----------- | ------------------ | ----------- | ---------------------- |
| `action`    | `string`           | `undefined` | Upload endpoint URL    |
| `fileList`  | `UploadFileInfo[]` | `[]`        | Managed file list      |
| `accept`    | `string`           | `undefined` | Accepted file types    |
| `multiple`  | `boolean`          | `false`     | Allow multiple files   |
| `directory` | `boolean`          | `false`     | Allow directory upload |
| `disabled`  | `boolean`          | `false`     | Disable upload         |

### UploadFileInfo Interface

| Field        | Type                                                             | Description             |
| ------------ | ---------------------------------------------------------------- | ----------------------- |
| `id`         | `string`                                                         | Unique file ID          |
| `name`       | `string`                                                         | File name               |
| `status`     | `'pending' \| 'uploading' \| 'finished' \| 'error' \| 'removed'` | Upload status           |
| `percentage` | `number`                                                         | Upload progress (0-100) |
| `url`        | `string`                                                         | File URL (after upload) |
| `file`       | `File`                                                           | Native File object      |
