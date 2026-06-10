# Message

Lightweight inline notifications with auto-dismiss and imperative API.

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
    <CxButton @click="message.info('This is an info message')">Info</CxButton>
    <CxButton @click="message.success('Operation successful')">Success</CxButton>
    <CxButton @click="message.warning('Something went wrong')">Warning</CxButton>
    <CxButton @click="message.error('Error occurred')">Error</CxButton>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from '@chronixjs/ui-vue3';
import { CxButton } from '@chronixjs/ui-vue3';

const message = useMessage();
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
import { useMessage } from '@chronixjs/ui-vue2';
import { CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxButton },
  methods: {
    showInfo() {
      useMessage().info('This is an info message');
    },
    showSuccess() {
      useMessage().success('Operation successful');
    },
    showWarning() {
      useMessage().warning('Something went wrong');
    },
    showError() {
      useMessage().error('Error occurred');
    },
  },
};
</script>
```

```tsx [React]
import { useMessage } from '@chronixjs/ui-react';
import { CxButton } from '@chronixjs/ui-react';

export function App() {
  const message = useMessage();

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <CxButton onClick={() => message.info('This is an info message')}>Info</CxButton>
      <CxButton onClick={() => message.success('Operation successful')}>Success</CxButton>
      <CxButton onClick={() => message.warning('Something went wrong')}>Warning</CxButton>
      <CxButton onClick={() => message.error('Error occurred')}>Error</CxButton>
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
    <CxButton @click="showPersistent">Persistent (no auto-dismiss)</CxButton>
    <CxButton @click="showQuick">Quick (1.5s)</CxButton>
    <CxButton @click="message.destroyAll()">Destroy All</CxButton>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from '@chronixjs/ui-vue3';
import { CxButton } from '@chronixjs/ui-vue3';

const message = useMessage();

function showPersistent() {
  message.create({ content: 'This message stays until manually closed', duration: 0 });
}

function showQuick() {
  message.create({ content: 'This disappears quickly', duration: 1500 });
}
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; gap: 8px;">
    <CxButton @click="showPersistent">Persistent (no auto-dismiss)</CxButton>
    <CxButton @click="showQuick">Quick (1.5s)</CxButton>
    <CxButton @click="destroyAll">Destroy All</CxButton>
  </div>
</template>

<script>
import { useMessage } from '@chronixjs/ui-vue2';
import { CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxButton },
  methods: {
    showPersistent() {
      useMessage().create({ content: 'This message stays until manually closed', duration: 0 });
    },
    showQuick() {
      useMessage().create({ content: 'This disappears quickly', duration: 1500 });
    },
    destroyAll() {
      useMessage().destroyAll();
    },
  },
};
</script>
```

```tsx [React]
import { useMessage } from '@chronixjs/ui-react';
import { CxButton } from '@chronixjs/ui-react';

export function App() {
  const message = useMessage();

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <CxButton
        onClick={() =>
          message.create({ content: 'This message stays until manually closed', duration: 0 })
        }
      >
        Persistent (no auto-dismiss)
      </CxButton>
      <CxButton
        onClick={() => message.create({ content: 'This disappears quickly', duration: 1500 })}
      >
        Quick (1.5s)
      </CxButton>
      <CxButton onClick={() => message.destroyAll()}>Destroy All</CxButton>
    </div>
  );
}
```

:::

## With Closable

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; gap: 8px;">
    <CxButton @click="showClosable">Closable Message</CxButton>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from '@chronixjs/ui-vue3';
import { CxButton } from '@chronixjs/ui-vue3';

const message = useMessage();

function showClosable() {
  message.create({
    content: 'Click the close button to dismiss this message',
    closable: true,
    duration: 0,
  });
}
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; gap: 8px;">
    <CxButton @click="showClosable">Closable Message</CxButton>
  </div>
</template>

<script>
import { useMessage } from '@chronixjs/ui-vue2';
import { CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxButton },
  methods: {
    showClosable() {
      useMessage().create({
        content: 'Click the close button to dismiss this message',
        closable: true,
        duration: 0,
      });
    },
  },
};
</script>
```

```tsx [React]
import { useMessage } from '@chronixjs/ui-react';
import { CxButton } from '@chronixjs/ui-react';

export function App() {
  const message = useMessage();

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <CxButton
        onClick={() =>
          message.create({
            content: 'Click the close button to dismiss this message',
            closable: true,
            duration: 0,
          })
        }
      >
        Closable Message
      </CxButton>
    </div>
  );
}
```

:::

## API Reference

### Methods

| Method                       | Description           |
| ---------------------------- | --------------------- |
| `create(options)`            | Create custom message |
| `info(content, options?)`    | Info message          |
| `success(content, options?)` | Success message       |
| `warning(content, options?)` | Warning message       |
| `error(content, options?)`   | Error message         |
| `destroyAll()`               | Clear all messages    |

### MessageCreateOptions

| Prop       | Type                                                       | Default  | Description                      |
| ---------- | ---------------------------------------------------------- | -------- | -------------------------------- |
| `content`  | `string`                                                   | —        | Message text (required)          |
| `type`     | `'info' \| 'success' \| 'warning' \| 'error' \| 'loading'` | `'info'` | Message type                     |
| `duration` | `number`                                                   | `3000`   | Auto-dismiss ms (0 = persistent) |
| `closable` | `boolean`                                                  | `false`  | Show close button                |
