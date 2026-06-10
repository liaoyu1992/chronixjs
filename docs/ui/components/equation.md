# Equation 公式

MathML 渲染器，在原生 `<math>` 元素内注入标记。

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

## API 参考

### 属性 (Props)

| Prop      | 类型                  | 默认值     | 描述                   |
| --------- | --------------------- | ---------- | ---------------------- |
| `value`   | `string`              | `''`       | MathML 标记字符串      |
| `display` | `'inline' \| 'block'` | `'inline'` | 显示模式（行内或块级） |
