<script setup>
import FlexBasic from './demos/flex/FlexBasic.vue';
import flexBasicCode from './demos/flex/FlexBasic.vue?raw';
import flexBasicVue2 from './demos/flex/FlexBasic.vue2?raw';
import flexBasicReact from './demos/flex/FlexBasic.react?raw';
import FlexVertical from './demos/flex/FlexVertical.vue';
import flexVerticalCode from './demos/flex/FlexVertical.vue?raw';
import flexVerticalVue2 from './demos/flex/FlexVertical.vue2?raw';
import flexVerticalReact from './demos/flex/FlexVertical.react?raw';
import FlexGap from './demos/flex/FlexGap.vue';
import flexGapCode from './demos/flex/FlexGap.vue?raw';
import flexGapVue2 from './demos/flex/FlexGap.vue2?raw';
import flexGapReact from './demos/flex/FlexGap.react?raw';
</script>

# Flex 弹性布局

Flexbox 布局容器，使用符合 CSS 习惯的属性名称。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="使用 Flex 进行水平布局，通过 gap 属性设置间距。" :code="flexBasicCode" :code-vue2="flexBasicVue2" :code-react="flexBasicReact">
  <FlexBasic />
</DemoBox>

## 列方向

<DemoBox title="列方向" description="通过 direction 属性设置 column 方向排列。" :code="flexVerticalCode" :code-vue2="flexVerticalVue2" :code-react="flexVerticalReact">
  <FlexVertical />
</DemoBox>

## 自定义间距

<DemoBox title="自定义间距" description="通过 gap 属性设置数字类型的间距（像素）。" :code="flexGapCode" :code-vue2="flexGapVue2" :code-react="flexGapReact">
  <FlexGap />
</DemoBox>

## API 参考

### 属性 (Props)

| Prop        | 类型                                                                                               | 默认值      | 描述                           |
| ----------- | -------------------------------------------------------------------------------------------------- | ----------- | ------------------------------ |
| `direction` | `'row' \| 'column' \| 'row-reverse' \| 'column-reverse'`                                           | `'row'`     | Flexbox 方向                   |
| `wrap`      | `'nowrap' \| 'wrap' \| 'wrap-reverse'`                                                             | `'nowrap'`  | Flexbox 换行                   |
| `align`     | `'start' \| 'center' \| 'end' \| 'baseline' \| 'stretch' \| undefined`                             | `undefined` | 交叉轴对齐                     |
| `justify`   | `'start' \| 'center' \| 'end' \| 'space-around' \| 'space-between' \| 'space-evenly' \| undefined` | `undefined` | 主轴对齐                       |
| `gap`       | `'small' \| 'medium' \| 'large' \| number \| undefined`                                            | `undefined` | 子元素间距                     |
| `inline`    | `boolean`                                                                                          | `false`     | 使用 `inline-flex` 代替 `flex` |

### 插槽 (Slots)

| Slot      | 描述        |
| --------- | ----------- |
| `default` | Flex 子元素 |
