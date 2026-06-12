<script setup>
import CollapseBasic from './demos/collapse/CollapseBasic.vue';
import collapseBasicCode from './demos/collapse/CollapseBasic.vue?raw';
import collapseBasicVue2 from './demos/collapse/CollapseBasic.vue2?raw';
import collapseBasicReact from './demos/collapse/CollapseBasic.react?raw';
import CollapseAccordion from './demos/collapse/CollapseAccordion.vue';
import collapseAccordionCode from './demos/collapse/CollapseAccordion.vue?raw';
import collapseAccordionVue2 from './demos/collapse/CollapseAccordion.vue2?raw';
import collapseAccordionReact from './demos/collapse/CollapseAccordion.react?raw';
</script>

# Collapse 折叠面板

手风琴/多展开面板列表，用于切换内容可见性。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="多展开模式的折叠面板。" :code="collapseBasicCode" :code-vue2="collapseBasicVue2" :code-react="collapseBasicReact">
  <CollapseBasic />
</DemoBox>

## 手风琴模式

<DemoBox title="手风琴模式" description="使用 accordion 属性限制同时只能展开一个面板。" :code="collapseAccordionCode" :code-vue2="collapseAccordionVue2" :code-react="collapseAccordionReact">
  <CollapseAccordion />
</DemoBox>

## API 参考

### 属性 (Props)

| 属性             | 类型                 | 默认值      | 说明         |
| ---------------- | -------------------- | ----------- | ------------ |
| `value`          | `string \| string[]` | `undefined` | 展开的键值   |
| `items`          | `CollapseItem[]`     | `[]`        | 面板项       |
| `accordion`      | `boolean`            | `false`     | 单选展开模式 |
| `arrowPlacement` | `'left' \| 'right'`  | `'left'`    | 箭头位置     |

### 事件 (Events)

| 事件           | 载荷                               | 说明               |
| -------------- | ---------------------------------- | ------------------ |
| `update:value` | `string \| string[]`               | 展开键值变化时触发 |
| `item-change`  | `(key: string, expanded: boolean)` | 单个面板切换时触发 |
