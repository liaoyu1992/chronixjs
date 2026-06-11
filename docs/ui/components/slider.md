<script setup>
import SliderBasic from './demos/slider/SliderBasic.vue';
import sliderBasicCode from './demos/slider/SliderBasic.vue?raw';
import sliderBasicVue2 from './demos/slider/SliderBasic.vue2?raw';
import sliderBasicReact from './demos/slider/SliderBasic.react?raw';
import SliderRange from './demos/slider/SliderRange.vue';
import sliderRangeCode from './demos/slider/SliderRange.vue?raw';
import sliderRangeVue2 from './demos/slider/SliderRange.vue2?raw';
import sliderRangeReact from './demos/slider/SliderRange.react?raw';
import SliderDisabled from './demos/slider/SliderDisabled.vue';
import sliderDisabledCode from './demos/slider/SliderDisabled.vue?raw';
import sliderDisabledVue2 from './demos/slider/SliderDisabled.vue2?raw';
import sliderDisabledReact from './demos/slider/SliderDisabled.react?raw';
</script>

# Slider 滑块

单滑块或范围滑块，支持可选的刻度标记和工具提示。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="基础滑块用法。" :code="sliderBasicCode" :code-vue2="sliderBasicVue2" :code-react="sliderBasicReact">
  <SliderBasic />
</DemoBox>

## 范围模式

<DemoBox title="范围模式" description="使用 range 属性启用双滑块范围模式。" :code="sliderRangeCode" :code-vue2="sliderRangeVue2" :code-react="sliderRangeReact">
  <SliderRange />
</DemoBox>

## 禁用状态

<DemoBox title="禁用状态" description="禁用滑块不可交互。" :code="sliderDisabledCode" :code-vue2="sliderDisabledVue2" :code-react="sliderDisabledReact">
  <SliderDisabled />
</DemoBox>

## API 参考

### 属性 (Props)

| 属性       | 类型                         | 默认值  | 说明                 |
| ---------- | ---------------------------- | ------- | -------------------- |
| `value`    | `number \| [number, number]` | `0`     | 当前值（单个或范围） |
| `range`    | `boolean`                    | `false` | 启用双滑块范围模式   |
| `min`      | `number`                     | `0`     | 最小值               |
| `max`      | `number`                     | `100`   | 最大值               |
| `step`     | `number`                     | `1`     | 步长                 |
| `marks`    | `Record<number, SliderMark>` | `{}`    | 特定值的标签标记     |
| `disabled` | `boolean`                    | `false` | 禁用滑块             |
| `tooltip`  | `boolean`                    | `true`  | 悬停时显示工具提示   |
| `vertical` | `boolean`                    | `false` | 垂直方向             |

### 事件 (Events)

| 事件           | 载荷                         | 说明         |
| -------------- | ---------------------------- | ------------ |
| `update:value` | `number \| [number, number]` | 值变化时触发 |
