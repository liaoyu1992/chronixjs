<script setup>
import CodeBasic from './demos/code/CodeBasic.vue';
import codeBasicCode from './demos/code/CodeBasic.vue?raw';
import codeBasicVue2 from './demos/code/CodeBasic.vue2?raw';
import codeBasicReact from './demos/code/CodeBasic.react?raw';
import CodeInline from './demos/code/CodeInline.vue';
import codeInlineCode from './demos/code/CodeInline.vue?raw';
import codeInlineVue2 from './demos/code/CodeInline.vue2?raw';
import codeInlineReact from './demos/code/CodeInline.react?raw';
</script>

# Code 代码

使用 `<pre><code>` 渲染的代码块组件。v0.1.0 版本暂不支持语法高亮。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="展示代码块的默认用法。" :code="codeBasicCode" :code-vue2="codeBasicVue2" :code-react="codeBasicReact">
  <CodeBasic />
</DemoBox>

## 行内代码

<DemoBox title="行内代码" description="通过 inline 属性将代码渲染为行内元素。" :code="codeInlineCode" :code-vue2="codeInlineVue2" :code-react="codeInlineReact">
  <CodeInline />
</DemoBox>

## API 参考

### 属性 (Props)

| 属性     | 类型      | 默认值  | 说明                                |
| -------- | --------- | ------- | ----------------------------------- |
| `value`  | `string`  | `''`    | 代码文本内容                        |
| `inline` | `boolean` | `false` | 渲染为行内 `<code>`（不带 `<pre>`） |
