<script setup>
import IconBasic from './demos/icon/IconBasic.vue';
import iconBasicCode from './demos/icon/IconBasic.vue?raw';
import iconBasicVue2 from './demos/icon/IconBasic.vue2?raw';
import iconBasicReact from './demos/icon/IconBasic.react?raw';
</script>

# Icon 图标

由中心图标注册表驱动的 SVG 图标组件。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="使用 name 属性指定图标名称，size 属性设置尺寸。" :code="iconBasicCode" :code-vue2="iconBasicVue2" :code-react="iconBasicReact">
  <IconBasic />
</DemoBox>

## API 参考

### 属性 (Props)

| Prop    | 类型     | 默认值 | 描述               |
| ------- | -------- | ------ | ------------------ |
| `name`  | `string` | `''`   | 图标注册表名称     |
| `size`  | `number` | `16`   | 图标尺寸（像素）   |
| `color` | `string` | `''`   | 图标颜色（CSS 值） |
