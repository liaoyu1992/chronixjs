<script setup>
import RateBasic from './demos/rate/RateBasic.vue';
import rateBasicCode from './demos/rate/RateBasic.vue?raw';
import rateBasicVue2 from './demos/rate/RateBasic.vue2?raw';
import rateBasicReact from './demos/rate/RateBasic.react?raw';
import RateHalf from './demos/rate/RateHalf.vue';
import rateHalfCode from './demos/rate/RateHalf.vue?raw';
import rateHalfVue2 from './demos/rate/RateHalf.vue2?raw';
import rateHalfReact from './demos/rate/RateHalf.react?raw';
import RateReadonly from './demos/rate/RateReadonly.vue';
import rateReadonlyCode from './demos/rate/RateReadonly.vue?raw';
import rateReadonlyVue2 from './demos/rate/RateReadonly.vue2?raw';
import rateReadonlyReact from './demos/rate/RateReadonly.react?raw';
import RateCustomCount from './demos/rate/RateCustomCount.vue';
import rateCustomCountCode from './demos/rate/RateCustomCount.vue?raw';
import rateCustomCountVue2 from './demos/rate/RateCustomCount.vue2?raw';
import rateCustomCountReact from './demos/rate/RateCustomCount.react?raw';
</script>

# Rate 评分

星级评分输入组件，支持可选的半星精度。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="星级评分的基础用法。" :code="rateBasicCode" :code-vue2="rateBasicVue2" :code-react="rateBasicReact">
  <RateBasic />
</DemoBox>

## 半星

<DemoBox title="半星" description="通过 allow-half 属性启用半星精度。" :code="rateHalfCode" :code-vue2="rateHalfVue2" :code-react="rateHalfReact">
  <RateHalf />
</DemoBox>

## 只读模式

<DemoBox title="只读模式" description="使用 readonly 属性实现仅展示的评分。" :code="rateReadonlyCode" :code-vue2="rateReadonlyVue2" :code-react="rateReadonlyReact">
  <RateReadonly />
</DemoBox>

## 自定义星星数量

<DemoBox title="自定义星星数量" description="使用 count 属性显示更多星星。" :code="rateCustomCountCode" :code-vue2="rateCustomCountVue2" :code-react="rateCustomCountReact">
  <RateCustomCount />
</DemoBox>

## API 参考

### 属性 (Props)

| 属性        | 类型      | 默认值      | 说明         |
| ----------- | --------- | ----------- | ------------ |
| `value`     | `number`  | `0`         | 当前评分     |
| `count`     | `number`  | `5`         | 星星数量     |
| `allowHalf` | `boolean` | `false`     | 半星精度     |
| `disabled`  | `boolean` | `false`     | 禁用交互     |
| `readonly`  | `boolean` | `false`     | 只读显示     |
| `error`     | `string`  | `undefined` | 错误提示信息 |

### 事件 (Events)

| 事件           | 载荷     | 说明     |
| -------------- | -------- | -------- |
| `update:value` | `number` | 评分变化 |
