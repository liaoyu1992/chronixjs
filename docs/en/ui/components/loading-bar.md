# Loading Bar

Imperative top-of-viewport loading bar that indicates progress through states: idle, loading, finishing, error.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

Loading bar is an imperative API — you control its state programmatically.

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

## API Reference

### LoadingBarState

| Value         | Description                         |
| ------------- | ----------------------------------- |
| `'idle'`      | Bar is hidden                       |
| `'loading'`   | Bar animates across the top         |
| `'finishing'` | Bar completes and fades out         |
| `'error'`     | Bar shows error color and fades out |
