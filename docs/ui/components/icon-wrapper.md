<script setup>
import IconWrapperBasic from './demos/icon-wrapper/IconWrapperBasic.vue';
import iconWrapperBasicCode from './demos/icon-wrapper/IconWrapperBasic.vue?raw';
import iconWrapperBasicVue2 from './demos/icon-wrapper/IconWrapperBasic.vue2?raw';
import iconWrapperBasicReact from './demos/icon-wrapper/IconWrapperBasic.react?raw';
</script>

# Icon Wrapper 图标包装器

为任意图标内容提供尺寸和颜色包装。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## 基础用法

<DemoBox title="基础用法" description="使用 IconWrapper 包裹自定义内容并设置尺寸和颜色。" :code="iconWrapperBasicCode" :code-vue2="iconWrapperBasicVue2" :code-react="iconWrapperBasicReact">
  <IconWrapperBasic />
</DemoBox>

## API 参考

### 属性 (Props)

| Prop    | 类型                  | 默认值      | 描述                           |
| ------- | --------------------- | ----------- | ------------------------------ |
| `size`  | `number`              | `24`        | 宽高（像素）                   |
| `color` | `string \| undefined` | `undefined` | CSS 颜色；未定义时继承父级颜色 |

### 插槽 (Slots)

| Slot      | 描述     |
| --------- | -------- |
| `default` | 图标内容 |
