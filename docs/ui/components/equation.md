<script setup>
import EquationBasic from './demos/equation/EquationBasic.vue';
import equationBasicCode from './demos/equation/EquationBasic.vue?raw';
import equationBasicVue2 from './demos/equation/EquationBasic.vue2?raw';
import equationBasicReact from './demos/equation/EquationBasic.react?raw';
</script>

# Equation 公式

MathML 渲染器，在原生 `<math>` 元素内注入标记。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## 基础用法

<DemoBox title="基础用法" description="展示 E = mc^2 公式。" :code="equationBasicCode" :code-vue2="equationBasicVue2" :code-react="equationBasicReact">
  <EquationBasic />
</DemoBox>

## API 参考

### 属性 (Props)

| Prop      | 类型                  | 默认值     | 描述                   |
| --------- | --------------------- | ---------- | ---------------------- |
| `value`   | `string`              | `''`       | MathML 标记字符串      |
| `display` | `'inline' \| 'block'` | `'inline'` | 显示模式（行内或块级） |
