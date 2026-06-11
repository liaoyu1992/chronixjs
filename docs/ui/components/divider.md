<script setup>
import DividerBasic from './demos/divider/DividerBasic.vue';
import dividerBasicCode from './demos/divider/DividerBasic.vue?raw';
import dividerBasicVue2 from './demos/divider/DividerBasic.vue2?raw';
import dividerBasicReact from './demos/divider/DividerBasic.react?raw';
import DividerWithTitle from './demos/divider/DividerWithTitle.vue';
import dividerWithTitleCode from './demos/divider/DividerWithTitle.vue?raw';
import dividerWithTitleVue2 from './demos/divider/DividerWithTitle.vue2?raw';
import dividerWithTitleReact from './demos/divider/DividerWithTitle.react?raw';
import DividerVertical from './demos/divider/DividerVertical.vue';
import dividerVerticalCode from './demos/divider/DividerVertical.vue?raw';
import dividerVerticalVue2 from './demos/divider/DividerVertical.vue2?raw';
import dividerVerticalReact from './demos/divider/DividerVertical.react?raw';
import DividerDashed from './demos/divider/DividerDashed.vue';
import dividerDashedCode from './demos/divider/DividerDashed.vue?raw';
import dividerDashedVue2 from './demos/divider/DividerDashed.vue2?raw';
import dividerDashedReact from './demos/divider/DividerDashed.react?raw';
</script>

# Divider 分割线

带有可选标题的可视分割线。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="内容块之间的简单水平分割线。" :code="dividerBasicCode" :code-vue2="dividerBasicVue2" :code-react="dividerBasicReact">
  <DividerBasic />
</DemoBox>

## 带标题

<DemoBox title="带标题" description="通过默认插槽放置标题，使用 title-placement 控制对齐。" :code="dividerWithTitleCode" :code-vue2="dividerWithTitleVue2" :code-react="dividerWithTitleReact">
  <DividerWithTitle />
</DemoBox>

## 垂直分割

<DemoBox title="垂直分割" description="使用 vertical 属性渲染垂直分割线。" :code="dividerVerticalCode" :code-vue2="dividerVerticalVue2" :code-react="dividerVerticalReact">
  <DividerVertical />
</DemoBox>

## 虚线

<DemoBox title="虚线" description="使用 dashed 属性渲染虚线分割线。" :code="dividerDashedCode" :code-vue2="dividerDashedVue2" :code-react="dividerDashedReact">
  <DividerDashed />
</DemoBox>

## API 参考

### 属性 (Props)

| 属性             | 类型                            | 默认值     | 说明       |
| ---------------- | ------------------------------- | ---------- | ---------- |
| `vertical`       | `boolean`                       | `false`    | 垂直分割线 |
| `titlePlacement` | `'left' \| 'center' \| 'right'` | `'center'` | 标题位置   |
| `dashed`         | `boolean`                       | `false`    | 虚线样式   |

### 插槽 (Slots)

| 插槽      | 说明           |
| --------- | -------------- |
| `default` | 分割线标题内容 |
