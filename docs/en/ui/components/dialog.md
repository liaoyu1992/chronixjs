# Dialog

Modal dialog with imperative API for confirmations and alerts.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

This component uses an imperative API via a composable / hook. Call the returned methods to show dialogs programmatically.

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

## Dialog Types

Use different methods to display dialogs with appropriate semantic styling.

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

## Custom Dialog

Use `dialog.create()` for full control over the dialog type and content.

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

## API Reference

### Methods

| Method             | Description            |
| ------------------ | ---------------------- |
| `create(options)`  | Create custom dialog   |
| `info(options)`    | Info dialog            |
| `success(options)` | Success dialog         |
| `warning(options)` | Warning dialog         |
| `error(options)`   | Error dialog           |
| `destroy(id)`      | Remove specific dialog |
| `destroyAll()`     | Clear all dialogs      |

### DialogCreateOptions

| Prop           | Type                                                       | Default     | Description             |
| -------------- | ---------------------------------------------------------- | ----------- | ----------------------- |
| `title`        | `string`                                                   | `undefined` | Dialog title            |
| `content`      | `string`                                                   | —           | Body content (required) |
| `type`         | `'default' \| 'info' \| 'success' \| 'warning' \| 'error'` | `'default'` | Dialog type             |
| `positiveText` | `string`                                                   | `undefined` | Confirm button label    |
| `negativeText` | `string`                                                   | `undefined` | Cancel button label     |
| `closable`     | `boolean`                                                  | `true`      | Show close button       |
