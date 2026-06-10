# Notification

Rich card-like notifications with title and description, using an imperative API.

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
  <div style="display: flex; gap: 8px;">
    <CxButton @click="notify.info({ title: 'Info', description: 'Notification content' })">
      Info
    </CxButton>
    <CxButton @click="notify.success({ title: 'Success', description: 'Operation done' })">
      Success
    </CxButton>
    <CxButton @click="notify.warning({ title: 'Warning', description: 'Check this' })">
      Warning
    </CxButton>
    <CxButton @click="notify.error({ title: 'Error', description: 'Something failed' })">
      Error
    </CxButton>
  </div>
</template>

<script setup lang="ts">
import { useNotification } from '@chronixjs/ui-vue3';
import { CxButton } from '@chronixjs/ui-vue3';

const notify = useNotification();
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; gap: 8px;">
    <CxButton @click="showInfo">Info</CxButton>
    <CxButton @click="showSuccess">Success</CxButton>
    <CxButton @click="showWarning">Warning</CxButton>
    <CxButton @click="showError">Error</CxButton>
  </div>
</template>

<script>
import { useNotification } from '@chronixjs/ui-vue2';
import { CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxButton },
  methods: {
    showInfo() {
      useNotification().info({ title: 'Info', description: 'Notification content' });
    },
    showSuccess() {
      useNotification().success({ title: 'Success', description: 'Operation done' });
    },
    showWarning() {
      useNotification().warning({ title: 'Warning', description: 'Check this' });
    },
    showError() {
      useNotification().error({ title: 'Error', description: 'Something failed' });
    },
  },
};
</script>
```

```tsx [React]
import { useNotification } from '@chronixjs/ui-react';
import { CxButton } from '@chronixjs/ui-react';

export function App() {
  const notify = useNotification();

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <CxButton onClick={() => notify.info({ title: 'Info', description: 'Notification content' })}>
        Info
      </CxButton>
      <CxButton onClick={() => notify.success({ title: 'Success', description: 'Operation done' })}>
        Success
      </CxButton>
      <CxButton onClick={() => notify.warning({ title: 'Warning', description: 'Check this' })}>
        Warning
      </CxButton>
      <CxButton onClick={() => notify.error({ title: 'Error', description: 'Something failed' })}>
        Error
      </CxButton>
    </div>
  );
}
```

:::

## With Duration

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; gap: 8px;">
    <CxButton @click="showPersistent">Persistent Notification</CxButton>
    <CxButton @click="showQuick">Quick (2s)</CxButton>
    <CxButton @click="notify.destroyAll()">Destroy All</CxButton>
  </div>
</template>

<script setup lang="ts">
import { useNotification } from '@chronixjs/ui-vue3';
import { CxButton } from '@chronixjs/ui-vue3';

const notify = useNotification();

function showPersistent() {
  notify.create({
    title: 'Persistent',
    description: 'This notification stays until manually closed',
    duration: 0,
  });
}

function showQuick() {
  notify.create({
    title: 'Quick',
    description: 'This disappears in 2 seconds',
    duration: 2000,
  });
}
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; gap: 8px;">
    <CxButton @click="showPersistent">Persistent Notification</CxButton>
    <CxButton @click="showQuick">Quick (2s)</CxButton>
    <CxButton @click="destroyAll">Destroy All</CxButton>
  </div>
</template>

<script>
import { useNotification } from '@chronixjs/ui-vue2';
import { CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxButton },
  methods: {
    showPersistent() {
      useNotification().create({
        title: 'Persistent',
        description: 'This notification stays until manually closed',
        duration: 0,
      });
    },
    showQuick() {
      useNotification().create({
        title: 'Quick',
        description: 'This disappears in 2 seconds',
        duration: 2000,
      });
    },
    destroyAll() {
      useNotification().destroyAll();
    },
  },
};
</script>
```

```tsx [React]
import { useNotification } from '@chronixjs/ui-react';
import { CxButton } from '@chronixjs/ui-react';

export function App() {
  const notify = useNotification();

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <CxButton
        onClick={() =>
          notify.create({
            title: 'Persistent',
            description: 'This notification stays until manually closed',
            duration: 0,
          })
        }
      >
        Persistent Notification
      </CxButton>
      <CxButton
        onClick={() =>
          notify.create({
            title: 'Quick',
            description: 'This disappears in 2 seconds',
            duration: 2000,
          })
        }
      >
        Quick (2s)
      </CxButton>
      <CxButton onClick={() => notify.destroyAll()}>Destroy All</CxButton>
    </div>
  );
}
```

:::

## Without Closable

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; gap: 8px;">
    <CxButton @click="showNoClose">No Close Button</CxButton>
  </div>
</template>

<script setup lang="ts">
import { useNotification } from '@chronixjs/ui-vue3';
import { CxButton } from '@chronixjs/ui-vue3';

const notify = useNotification();

function showNoClose() {
  notify.create({
    title: 'Auto-dismiss only',
    description: 'This notification has no close button and will auto-dismiss',
    closable: false,
    duration: 5000,
  });
}
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; gap: 8px;">
    <CxButton @click="showNoClose">No Close Button</CxButton>
  </div>
</template>

<script>
import { useNotification } from '@chronixjs/ui-vue2';
import { CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxButton },
  methods: {
    showNoClose() {
      useNotification().create({
        title: 'Auto-dismiss only',
        description: 'This notification has no close button and will auto-dismiss',
        closable: false,
        duration: 5000,
      });
    },
  },
};
</script>
```

```tsx [React]
import { useNotification } from '@chronixjs/ui-react';
import { CxButton } from '@chronixjs/ui-react';

export function App() {
  const notify = useNotification();

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <CxButton
        onClick={() =>
          notify.create({
            title: 'Auto-dismiss only',
            description: 'This notification has no close button and will auto-dismiss',
            closable: false,
            duration: 5000,
          })
        }
      >
        No Close Button
      </CxButton>
    </div>
  );
}
```

:::

## API Reference

### Methods

| Method             | Description                |
| ------------------ | -------------------------- |
| `create(options)`  | Create custom notification |
| `info(options)`    | Info notification          |
| `success(options)` | Success notification       |
| `warning(options)` | Warning notification       |
| `error(options)`   | Error notification         |
| `destroyAll()`     | Clear all notifications    |

### NotificationCreateOptions

| Prop          | Type                                          | Default     | Description           |
| ------------- | --------------------------------------------- | ----------- | --------------------- |
| `title`       | `string`                                      | —           | Title text (required) |
| `description` | `string`                                      | `undefined` | Description text      |
| `type`        | `'info' \| 'success' \| 'warning' \| 'error'` | `'info'`    | Notification type     |
| `duration`    | `number`                                      | `4500`      | Auto-dismiss ms       |
| `closable`    | `boolean`                                     | `true`      | Show close button     |
