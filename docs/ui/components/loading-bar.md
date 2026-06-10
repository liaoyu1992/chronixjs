# Loading Bar 加载条（命令式）

固定在视口顶部的命令式加载条，通过状态指示进度：空闲、加载中、完成、错误。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## 基础用法

加载条使用命令式 API 通过 composable 调用。调用 `start()` 开始，`finish()` 完成，`error()` 显示错误状态。

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; gap: 8px;">
    <CxButton @click="loading.start()">Start</CxButton>
    <CxButton @click="loading.finish()">Finish</CxButton>
    <CxButton @click="loading.error()">Error</CxButton>
  </div>
</template>

<script setup lang="ts">
import { useLoadingBar } from '@chronixjs/ui-vue3';
import { CxButton } from '@chronixjs/ui-vue3';
const loading = useLoadingBar();
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; gap: 8px;">
    <CxButton @click="startLoading">Start</CxButton>
    <CxButton @click="finishLoading">Finish</CxButton>
    <CxButton @click="errorLoading">Error</CxButton>
  </div>
</template>

<script>
import { useLoadingBar } from '@chronixjs/ui-vue2';
import { CxButton } from '@chronixjs/ui-vue2';
export default {
  components: { CxButton },
  methods: {
    startLoading() {
      useLoadingBar().start();
    },
    finishLoading() {
      useLoadingBar().finish();
    },
    errorLoading() {
      useLoadingBar().error();
    },
  },
};
</script>
```

```tsx [React]
import { useLoadingBar } from '@chronixjs/ui-react';
import { CxButton } from '@chronixjs/ui-react';

export function App() {
  const loading = useLoadingBar();

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <CxButton onClick={() => loading.start()}>Start</CxButton>
      <CxButton onClick={() => loading.finish()}>Finish</CxButton>
      <CxButton onClick={() => loading.error()}>Error</CxButton>
    </div>
  );
}
```

:::

## 配合路由

使用加载条指示页面导航进度。

::: code-group

```vue [Vue 3]
<template>
  <router-view />
</template>

<script setup lang="ts">
import { useLoadingBar } from '@chronixjs/ui-vue3';
import { useRouter } from 'vue-router';

const loading = useLoadingBar();
const router = useRouter();

router.beforeEach(() => {
  loading.start();
});

router.afterEach(() => {
  loading.finish();
});
</script>
```

```vue [Vue 2]
<template>
  <router-view />
</template>

<script>
import { useLoadingBar } from '@chronixjs/ui-vue2';
export default {
  name: 'App',
  mounted() {
    const loading = useLoadingBar();
    this.$router.beforeEach((to, from, next) => {
      loading.start();
      next();
    });
    this.$router.afterEach(() => {
      loading.finish();
    });
  },
};
</script>
```

```tsx [React]
import { useEffect } from 'react';
import { useLoadingBar } from '@chronixjs/ui-react';
import { useNavigate, useLocation } from 'react-router-dom';

export function LoadingGuard({ children }: { children: React.ReactNode }) {
  const loading = useLoadingBar();
  const location = useLocation();

  useEffect(() => {
    loading.start();
    const timer = setTimeout(() => loading.finish(), 300);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return <>{children}</>;
}
```

:::

## 自定义位置

使用 `position` 选项更改加载条位置。

::: code-group

```vue [Vue 3]
<template>
  <CxButton @click="loading.start()">Start Loading</CxButton>
</template>

<script setup lang="ts">
import { useLoadingBar } from '@chronixjs/ui-vue3';
import { CxButton } from '@chronixjs/ui-vue3';
const loading = useLoadingBar({ position: 'top', height: 3, color: '#42b883' });
</script>
```

```vue [Vue 2]
<template>
  <CxButton @click="startLoading">Start Loading</CxButton>
</template>

<script>
import { useLoadingBar } from '@chronixjs/ui-vue2';
import { CxButton } from '@chronixjs/ui-vue2';
export default {
  components: { CxButton },
  methods: {
    startLoading() {
      const loading = useLoadingBar({ position: 'top', height: 3, color: '#42b883' });
      loading.start();
    },
  },
};
</script>
```

```tsx [React]
import { useLoadingBar } from '@chronixjs/ui-react';
import { CxButton } from '@chronixjs/ui-react';

export function App() {
  const loading = useLoadingBar({ position: 'top', height: 3, color: '#42b883' });

  return <CxButton onClick={() => loading.start()}>Start Loading</CxButton>;
}
```

:::

## API 参考

### 方法 (Methods)

| Method     | 描述         |
| ---------- | ------------ |
| `start()`  | 开始加载动画 |
| `finish()` | 完成加载     |
| `error()`  | 显示错误状态 |

### 响应式状态

| State   | 类型                                                 | 描述           |
| ------- | ---------------------------------------------------- | -------------- |
| `state` | `Ref<'idle' \| 'loading' \| 'finishing' \| 'error'>` | 当前加载条状态 |

### 选项 (Options)

| Option       | 类型     | 默认值      | 描述                                |
| ------------ | -------- | ----------- | ----------------------------------- |
| `position`   | `string` | `'top'`     | 加载条位置（`'top'` 或 `'bottom'`） |
| `height`     | `number` | `2`         | 加载条高度（像素）                  |
| `color`      | `string` | `'#409eff'` | 主色调                              |
| `errorColor` | `string` | `'#f56c6c'` | 错误状态颜色                        |
