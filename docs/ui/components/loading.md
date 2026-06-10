# Loading Bar 加载条

固定在视口顶部的命令式加载条，通过状态指示进度：空闲、加载中、完成、错误。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## 基础用法

加载条是命令式 API，你通过编程方式控制其状态。

::: code-group

```vue [Vue 3]
<template>
  <button @click="startLoading">Start</button>
  <button @click="finishLoading">Finish</button>
  <CxLoadingBar :state="barState" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxLoadingBar } from '@chronixjs/ui-vue3';
import type { LoadingBarState } from '@chronixjs/ui';

const barState = ref<LoadingBarState>('idle');

function startLoading() {
  barState.value = 'loading';
}

function finishLoading() {
  barState.value = 'finishing';
}
</script>
```

```vue [Vue 2]
<template>
  <button @click="startLoading">Start</button>
  <button @click="finishLoading">Finish</button>
  <CxLoadingBar :state="barState" />
</template>

<script>
import { CxLoadingBar } from '@chronixjs/ui-vue2';
export default {
  components: { CxLoadingBar },
  data() {
    return { barState: 'idle' };
  },
  methods: {
    startLoading() {
      this.barState = 'loading';
    },
    finishLoading() {
      this.barState = 'finishing';
    },
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxLoadingBar } from '@chronixjs/ui-react';
import type { LoadingBarState } from '@chronixjs/ui';

export function App() {
  const [barState, setBarState] = useState<LoadingBarState>('idle');

  return (
    <div>
      <button onClick={() => setBarState('loading')}>Start</button>
      <button onClick={() => setBarState('finishing')}>Finish</button>
      <CxLoadingBar state={barState} />
    </div>
  );
}
```

:::

## API 参考

### LoadingBarState

| 值            | 描述                     |
| ------------- | ------------------------ |
| `'idle'`      | 加载条隐藏               |
| `'loading'`   | 加载条在顶部动画显示     |
| `'finishing'` | 加载条完成并淡出         |
| `'error'`     | 加载条显示错误颜色并淡出 |
