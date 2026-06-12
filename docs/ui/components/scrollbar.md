<script setup>
import ScrollbarBasic from './demos/scrollbar/ScrollbarBasic.vue';
import scrollbarBasicCode from './demos/scrollbar/ScrollbarBasic.vue?raw';
import scrollbarBasicVue2 from './demos/scrollbar/ScrollbarBasic.vue2?raw';
import scrollbarBasicReact from './demos/scrollbar/ScrollbarBasic.react?raw';
</script>

# Scrollbar 滚动条

自定义样式的滚动条容器，支持可配置的触发模式。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="垂直滚动条的基础用法。" :code="scrollbarBasicCode" :code-vue2="scrollbarBasicVue2" :code-react="scrollbarBasicReact">
  <ScrollbarBasic />
</DemoBox>

## API 参考

### 属性 (Props)

| 属性          | 类型                | 默认值    | 说明           |
| ------------- | ------------------- | --------- | -------------- |
| `trigger`     | `'hover' \| 'none'` | `'hover'` | 何时显示滚动条 |
| `xScrollable` | `boolean`           | `false`   | 启用横向滚动   |

### 插槽 (Slots)

| 插槽      | 说明       |
| --------- | ---------- |
| `default` | 可滚动内容 |
