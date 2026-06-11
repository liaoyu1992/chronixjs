<script setup>
import CollapseTransitionBasic from './demos/collapse-transition/CollapseTransitionBasic.vue';
import collapseTransitionBasicCode from './demos/collapse-transition/CollapseTransitionBasic.vue?raw';
import collapseTransitionBasicVue2 from './demos/collapse-transition/CollapseTransitionBasic.vue2?raw';
import collapseTransitionBasicReact from './demos/collapse-transition/CollapseTransitionBasic.react?raw';
</script>

# Collapse Transition 折叠过渡

用于展开/收起动画的高度过渡包装器。内部由 Collapse 使用，同时暴露给外部使用。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## 基础用法

<DemoBox title="基础用法" description="通过 show 属性控制内容的展开和收起。" :code="collapseTransitionBasicCode" :code-vue2="collapseTransitionBasicVue2" :code-react="collapseTransitionBasicReact">
  <CollapseTransitionBasic />
</DemoBox>

## API 参考

### 属性 (Props)

| 属性       | 类型      | 默认值  | 说明                          |
| ---------- | --------- | ------- | ----------------------------- |
| `show`     | `boolean` | `false` | `true` = 展开，`false` = 收起 |
| `duration` | `number`  | `200`   | 动画持续时间（毫秒）          |

### 插槽 (Slots)

| 插槽      | 说明           |
| --------- | -------------- |
| `default` | 需要过渡的内容 |
