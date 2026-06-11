<script setup>
import BadgeBasic from './demos/badge/BadgeBasic.vue';
import badgeBasicCode from './demos/badge/BadgeBasic.vue?raw';
import badgeBasicVue2 from './demos/badge/BadgeBasic.vue2?raw';
import badgeBasicReact from './demos/badge/BadgeBasic.react?raw';
import BadgeTypes from './demos/badge/BadgeTypes.vue';
import badgeTypesCode from './demos/badge/BadgeTypes.vue?raw';
import badgeTypesVue2 from './demos/badge/BadgeTypes.vue2?raw';
import badgeTypesReact from './demos/badge/BadgeTypes.react?raw';
import BadgeDot from './demos/badge/BadgeDot.vue';
import badgeDotCode from './demos/badge/BadgeDot.vue?raw';
import badgeDotVue2 from './demos/badge/BadgeDot.vue2?raw';
import badgeDotReact from './demos/badge/BadgeDot.react?raw';
import BadgeMax from './demos/badge/BadgeMax.vue';
import badgeMaxCode from './demos/badge/BadgeMax.vue?raw';
import badgeMaxVue2 from './demos/badge/BadgeMax.vue2?raw';
import badgeMaxReact from './demos/badge/BadgeMax.react?raw';
import BadgeProcessing from './demos/badge/BadgeProcessing.vue';
import badgeProcessingCode from './demos/badge/BadgeProcessing.vue?raw';
import badgeProcessingVue2 from './demos/badge/BadgeProcessing.vue2?raw';
import badgeProcessingReact from './demos/badge/BadgeProcessing.react?raw';
</script>

# Badge 徽标

徽标用于显示状态指示器、计数或通知。可以包裹子元素或独立渲染。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="包裹子元素显示数字徽标。" :code="badgeBasicCode" :code-vue2="badgeBasicVue2" :code-react="badgeBasicReact">
  <BadgeBasic />
</DemoBox>

## 徽标类型

<DemoBox title="徽标类型" description="不同语义类型的独立徽标。" :code="badgeTypesCode" :code-vue2="badgeTypesVue2" :code-react="badgeTypesReact">
  <BadgeTypes />
</DemoBox>

## 圆点模式

<DemoBox title="圆点模式" description="使用 dot 属性显示小圆点指示器。" :code="badgeDotCode" :code-vue2="badgeDotVue2" :code-react="badgeDotReact">
  <BadgeDot />
</DemoBox>

## 最大值

<DemoBox title="最大值" description="使用 max 截断大数字，超出时显示 max+。" :code="badgeMaxCode" :code-vue2="badgeMaxVue2" :code-react="badgeMaxReact">
  <BadgeMax />
</DemoBox>

## 脉冲动画

<DemoBox title="脉冲动画" description="使用 processing 属性添加脉冲动画。" :code="badgeProcessingCode" :code-vue2="badgeProcessingVue2" :code-react="badgeProcessingReact">
  <BadgeProcessing />
</DemoBox>

## API 参考

### 属性 (Props)

| 属性         | 类型                                                       | 默认值      | 说明           |
| ------------ | ---------------------------------------------------------- | ----------- | -------------- |
| `value`      | `number \| string \| undefined`                            | `undefined` | 徽标内容       |
| `max`        | `number \| undefined`                                      | `undefined` | 数字截断阈值   |
| `dot`        | `boolean`                                                  | `false`     | 圆点指示器模式 |
| `type`       | `'default' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'default'` | 语义颜色       |
| `processing` | `boolean`                                                  | `false`     | 脉冲动画       |
| `show`       | `boolean`                                                  | `true`      | 切换可见性     |

### 插槽 (Slots)

| 插槽      | 说明                         |
| --------- | ---------------------------- |
| `default` | 包裹的元素；省略则为独立模式 |
