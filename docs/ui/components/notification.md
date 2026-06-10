# Notification 通知

带标题和描述的富文本卡片式通知，使用命令式 API。

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

## 自定义持续时间

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

## 隐藏关闭按钮

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

## API 参考

### 方法 (Methods)

| 方法               | 说明           |
| ------------------ | -------------- |
| `create(options)`  | 创建自定义通知 |
| `info(options)`    | 信息类通知     |
| `success(options)` | 成功通知       |
| `warning(options)` | 警告通知       |
| `error(options)`   | 错误通知       |
| `destroyAll()`     | 清除所有通知   |

### NotificationCreateOptions

| 属性          | 类型                                          | 默认值      | 说明             |
| ------------- | --------------------------------------------- | ----------- | ---------------- |
| `title`       | `string`                                      | —           | 标题文本（必填） |
| `description` | `string`                                      | `undefined` | 描述文本         |
| `type`        | `'info' \| 'success' \| 'warning' \| 'error'` | `'info'`    | 通知类型         |
| `duration`    | `number`                                      | `4500`      | 自动关闭毫秒数   |
| `closable`    | `boolean`                                     | `true`      | 显示关闭按钮     |
