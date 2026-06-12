<script setup>
import CodeBasic from '../../../ui/components/demos/code/CodeBasic.vue';
import codeBasicCode from '../../../ui/components/demos/code/CodeBasic.vue?raw';
import codeBasicVue2 from '../../../ui/components/demos/code/CodeBasic.vue2?raw';
import codeBasicReact from '../../../ui/components/demos/code/CodeBasic.react?raw';
import CodeInline from '../../../ui/components/demos/code/CodeInline.vue';
import codeInlineCode from '../../../ui/components/demos/code/CodeInline.vue?raw';
import codeInlineVue2 from '../../../ui/components/demos/code/CodeInline.vue2?raw';
import codeInlineReact from '../../../ui/components/demos/code/CodeInline.react?raw';
</script>

# Code

Code block with `<pre><code>` rendering. No syntax highlighting in v0.1.0.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Default block code display." :code="codeBasicCode" :code-vue2="codeBasicVue2" :code-react="codeBasicReact">
  <CodeBasic />
</DemoBox>

## Inline Code

<DemoBox title="Inline Code" description="Render code inline with the inline prop." :code="codeInlineCode" :code-vue2="codeInlineVue2" :code-react="codeInlineReact">
  <CodeInline />
</DemoBox>

## API Reference

### Props

| Prop     | Type      | Default | Description                            |
| -------- | --------- | ------- | -------------------------------------- |
| `value`  | `string`  | `''`    | Code text content                      |
| `inline` | `boolean` | `false` | Render as inline `<code>` (no `<pre>`) |
