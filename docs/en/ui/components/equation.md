# Equation

MathML renderer — injects markup inside a native `<math>` element.

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
  <p>The quadratic formula: <CxEquation :value="formula" display="inline" /></p>
</template>

<script setup lang="ts">
import { CxEquation } from '@chronixjs/ui-vue3';

const formula =
  '<mrow><mi>x</mi><mo>=</mo><mfrac><mrow><mo>-</mo><mi>b</mi><mo>±</mo><msqrt><msup><mi>b</mi><mn>2</mn></msup><mo>-</mo><mn>4</mn><mi>a</mi><mi>c</mi></msqrt></mrow><mrow><mn>2</mn><mi>a</mi></mrow></mfrac></mrow>';
</script>
```

```vue [Vue 2]
<template>
  <p>The quadratic formula: <CxEquation :value="formula" display="inline" /></p>
</template>

<script>
import { CxEquation } from '@chronixjs/ui-vue2';
export default {
  components: { CxEquation },
  data() {
    return {
      formula:
        '<mrow><mi>x</mi><mo>=</mo><mfrac><mrow><mo>-</mo><mi>b</mi><mo>±</mo><msqrt><msup><mi>b</mi><mn>2</mn></msup><mo>-</mo><mn>4</mn><mi>a</mi><mi>c</mi></msqrt></mrow><mrow><mn>2</mn><mi>a</mi></mrow></mfrac></mrow>',
    };
  },
};
</script>
```

```tsx [React]
import { CxEquation } from '@chronixjs/ui-react';

export function App() {
  const formula =
    '<mrow><mi>x</mi><mo>=</mo><mfrac><mrow><mo>-</mo><mi>b</mi><mo>±</mo><msqrt><msup><mi>b</mi><mn>2</mn></msup><mo>-</mo><mn>4</mn><mi>a</mi><mi>c</mi></msqrt></mrow><mrow><mn>2</mn><mi>a</mi></mrow></mfrac></mrow>';

  return (
    <p>
      The quadratic formula: <CxEquation value={formula} display="inline" />
    </p>
  );
}
```

:::

## API Reference

### Props

| Prop      | Type                  | Default    | Description                    |
| --------- | --------------------- | ---------- | ------------------------------ |
| `value`   | `string`              | `''`       | MathML markup string           |
| `display` | `'inline' \| 'block'` | `'inline'` | Display mode (inline or block) |
