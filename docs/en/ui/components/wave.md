<script setup>
import WaveBasic from '../../../ui/components/demos/wave/WaveBasic.vue';
import waveBasicCode from '../../../ui/components/demos/wave/WaveBasic.vue?raw';
import waveBasicVue2 from '../../../ui/components/demos/wave/WaveBasic.vue2?raw';
import waveBasicReact from '../../../ui/components/demos/wave/WaveBasic.react?raw';
</script>

# Wave

CSS ripple wrapper — pointerdown triggers a brief keyframe animation on the wrapped element.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Wave wraps an element and shows a ripple animation on click." :code="waveBasicCode" :code-vue2="waveBasicVue2" :code-react="waveBasicReact">
  <WaveBasic />
</DemoBox>

## Custom Color

::: code-group

```vue [Vue 3]
<template>
  <CxWave color="rgba(59, 130, 246, 0.3)" :duration="400">
    <button>Blue ripple</button>
  </CxWave>
</template>

<script setup lang="ts">
import { CxWave } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxWave color="rgba(59, 130, 246, 0.3)" :duration="400">
    <button>Blue ripple</button>
  </CxWave>
</template>

<script>
import { CxWave } from '@chronixjs/ui-vue2';
export default { components: { CxWave } };
</script>
```

```tsx [React]
import { CxWave } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxWave color="rgba(59, 130, 246, 0.3)" duration={400}>
      <button>Blue ripple</button>
    </CxWave>
  );
}
```

:::

## API Reference

### Props

| Prop       | Type                  | Default     | Description                               |
| ---------- | --------------------- | ----------- | ----------------------------------------- |
| `color`    | `string \| undefined` | `undefined` | Ripple color (CSS); falls back to CSS var |
| `duration` | `number`              | `600`       | Animation duration in ms                  |
| `disabled` | `boolean`             | `false`     | Disable ripple                            |

### Slots

| Slot      | Description                 |
| --------- | --------------------------- |
| `default` | Element to wrap with ripple |
