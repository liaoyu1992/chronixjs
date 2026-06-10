# Message 消息提示

轻量级行内通知组件，支持自动消失和命令式 API。

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

## 自定义持续时间

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

## 可关闭消息

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

## API 参考

### 方法 (Methods)

| Method                       | 描述           |
| ---------------------------- | -------------- |
| `create(options)`            | 创建自定义消息 |
| `info(content, options?)`    | 信息提示       |
| `success(content, options?)` | 成功提示       |
| `warning(content, options?)` | 警告提示       |
| `error(content, options?)`   | 错误提示       |
| `destroyAll()`               | 清除所有消息   |

### MessageCreateOptions

| Prop       | 类型                                                       | 默认值   | 描述                             |
| ---------- | ---------------------------------------------------------- | -------- | -------------------------------- |
| `content`  | `string`                                                   | —        | 消息文本（必需）                 |
| `type`     | `'info' \| 'success' \| 'warning' \| 'error' \| 'loading'` | `'info'` | 消息类型                         |
| `duration` | `number`                                                   | `3000`   | 自动消失时间（毫秒，0 = 不消失） |
| `closable` | `boolean`                                                  | `false`  | 是否显示关闭按钮                 |
