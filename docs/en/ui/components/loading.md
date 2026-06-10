# Loading Bar

A thin imperative loading bar fixed at the viewport top.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

The loading bar uses an imperative API via a composable. Call `start()` to begin, `finish()` to complete, and `error()` to show an error state.

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

## With Router

Use the loading bar to indicate page navigation progress.

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

## Custom Position

Change the loading bar position using the `position` option.

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

## API Reference

### Methods

| Method     | Description             |
| ---------- | ----------------------- |
| `start()`  | Begin loading animation |
| `finish()` | Complete loading        |
| `error()`  | Show error state        |

### Reactive State

| State   | Type                                                 | Description       |
| ------- | ---------------------------------------------------- | ----------------- |
| `state` | `Ref<'idle' \| 'loading' \| 'finishing' \| 'error'>` | Current bar state |

### Options

| Option       | Type     | Default     | Description                          |
| ------------ | -------- | ----------- | ------------------------------------ |
| `position`   | `string` | `'top'`     | Bar position (`'top'` or `'bottom'`) |
| `height`     | `number` | `2`         | Bar height in pixels                 |
| `color`      | `string` | `'#409eff'` | Primary bar color                    |
| `errorColor` | `string` | `'#f56c6c'` | Error state bar color                |
