# Dialog 对话框

带有命令式 API 的模态对话框，用于确认和提示。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## 基础用法

该组件使用通过 composable / hook 调用的命令式 API。调用返回的方法以编程方式显示对话框。

::: code-group

```vue [Vue 3]
<template>
  <button @click="showDialog">Open Dialog</button>
</template>

<script setup lang="ts">
import { useDiscreteDialog } from '@chronixjs/ui-vue3';

const dialog = useDiscreteDialog();

function showDialog() {
  dialog.warning({
    title: 'Confirm Delete',
    content: 'Are you sure you want to delete this item?',
    positiveText: 'Delete',
    negativeText: 'Cancel',
  });
}
</script>
```

```vue [Vue 2]
<template>
  <button @click="showDialog">Open Dialog</button>
</template>

<script>
import { useDiscreteDialog } from '@chronixjs/ui-vue2';

export default {
  methods: {
    showDialog() {
      const dialog = useDiscreteDialog();
      dialog.warning({
        title: 'Confirm Delete',
        content: 'Are you sure you want to delete this item?',
        positiveText: 'Delete',
        negativeText: 'Cancel',
      });
    },
  },
};
</script>
```

```tsx [React]
import { useDiscreteDialog } from '@chronixjs/ui-react';

export function App() {
  const dialog = useDiscreteDialog();

  function showDialog() {
    dialog.warning({
      title: 'Confirm Delete',
      content: 'Are you sure you want to delete this item?',
      positiveText: 'Delete',
      negativeText: 'Cancel',
    });
  }

  return <button onClick={showDialog}>Open Dialog</button>;
}
```

:::

## 对话框类型

使用不同的方法来显示具有相应语义样式的对话框。

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; gap: 8px;">
    <button @click="showInfo">Info</button>
    <button @click="showSuccess">Success</button>
    <button @click="showWarning">Warning</button>
    <button @click="showError">Error</button>
  </div>
</template>

<script setup lang="ts">
import { useDiscreteDialog } from '@chronixjs/ui-vue3';

const dialog = useDiscreteDialog();

function showInfo() {
  dialog.info({
    title: 'Information',
    content: 'This is an informational message.',
  });
}

function showSuccess() {
  dialog.success({
    title: 'Success',
    content: 'Operation completed successfully.',
  });
}

function showWarning() {
  dialog.warning({
    title: 'Warning',
    content: 'Please review before proceeding.',
  });
}

function showError() {
  dialog.error({
    title: 'Error',
    content: 'Something went wrong. Please try again.',
  });
}
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; gap: 8px;">
    <button @click="showInfo">Info</button>
    <button @click="showSuccess">Success</button>
    <button @click="showWarning">Warning</button>
    <button @click="showError">Error</button>
  </div>
</template>

<script>
import { useDiscreteDialog } from '@chronixjs/ui-vue2';

export default {
  methods: {
    showInfo() {
      const dialog = useDiscreteDialog();
      dialog.info({
        title: 'Information',
        content: 'This is an informational message.',
      });
    },
    showSuccess() {
      const dialog = useDiscreteDialog();
      dialog.success({
        title: 'Success',
        content: 'Operation completed successfully.',
      });
    },
    showWarning() {
      const dialog = useDiscreteDialog();
      dialog.warning({
        title: 'Warning',
        content: 'Please review before proceeding.',
      });
    },
    showError() {
      const dialog = useDiscreteDialog();
      dialog.error({
        title: 'Error',
        content: 'Something went wrong. Please try again.',
      });
    },
  },
};
</script>
```

```tsx [React]
import { useDiscreteDialog } from '@chronixjs/ui-react';

export function App() {
  const dialog = useDiscreteDialog();

  function showInfo() {
    dialog.info({
      title: 'Information',
      content: 'This is an informational message.',
    });
  }

  function showSuccess() {
    dialog.success({
      title: 'Success',
      content: 'Operation completed successfully.',
    });
  }

  function showWarning() {
    dialog.warning({
      title: 'Warning',
      content: 'Please review before proceeding.',
    });
  }

  function showError() {
    dialog.error({
      title: 'Error',
      content: 'Something went wrong. Please try again.',
    });
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button onClick={showInfo}>Info</button>
      <button onClick={showSuccess}>Success</button>
      <button onClick={showWarning}>Warning</button>
      <button onClick={showError}>Error</button>
    </div>
  );
}
```

:::

## 自定义对话框

使用 `dialog.create()` 可以完全控制对话框类型和内容。

::: code-group

```vue [Vue 3]
<template>
  <button @click="showCustom">Custom Dialog</button>
</template>

<script setup lang="ts">
import { useDiscreteDialog } from '@chronixjs/ui-vue3';

const dialog = useDiscreteDialog();

function showCustom() {
  dialog.create({
    title: 'Terms of Service',
    content: 'Do you accept the terms and conditions?',
    type: 'warning',
    positiveText: 'Accept',
    negativeText: 'Decline',
    closable: true,
  });
}
</script>
```

```vue [Vue 2]
<template>
  <button @click="showCustom">Custom Dialog</button>
</template>

<script>
import { useDiscreteDialog } from '@chronixjs/ui-vue2';

export default {
  methods: {
    showCustom() {
      const dialog = useDiscreteDialog();
      dialog.create({
        title: 'Terms of Service',
        content: 'Do you accept the terms and conditions?',
        type: 'warning',
        positiveText: 'Accept',
        negativeText: 'Decline',
        closable: true,
      });
    },
  },
};
</script>
```

```tsx [React]
import { useDiscreteDialog } from '@chronixjs/ui-react';

export function App() {
  const dialog = useDiscreteDialog();

  function showCustom() {
    dialog.create({
      title: 'Terms of Service',
      content: 'Do you accept the terms and conditions?',
      type: 'warning',
      positiveText: 'Accept',
      negativeText: 'Decline',
      closable: true,
    });
  }

  return <button onClick={showCustom}>Custom Dialog</button>;
}
```

:::

## API 参考

### 方法 (Methods)

| 方法               | 说明             |
| ------------------ | ---------------- |
| `create(options)`  | 创建自定义对话框 |
| `info(options)`    | 信息对话框       |
| `success(options)` | 成功对话框       |
| `warning(options)` | 警告对话框       |
| `error(options)`   | 错误对话框       |
| `destroy(id)`      | 移除指定对话框   |
| `destroyAll()`     | 清除所有对话框   |

### DialogCreateOptions

| 属性           | 类型                                                       | 默认值      | 说明             |
| -------------- | ---------------------------------------------------------- | ----------- | ---------------- |
| `title`        | `string`                                                   | `undefined` | 对话框标题       |
| `content`      | `string`                                                   | —           | 正文内容（必填） |
| `type`         | `'default' \| 'info' \| 'success' \| 'warning' \| 'error'` | `'default'` | 对话框类型       |
| `positiveText` | `string`                                                   | `undefined` | 确认按钮文本     |
| `negativeText` | `string`                                                   | `undefined` | 取消按钮文本     |
| `closable`     | `boolean`                                                  | `true`      | 显示关闭按钮     |
