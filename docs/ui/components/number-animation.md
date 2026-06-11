<script setup>
import NumberAnimationBasic from './demos/number-animation/NumberAnimationBasic.vue';
import numberAnimationBasicCode from './demos/number-animation/NumberAnimationBasic.vue?raw';
import numberAnimationBasicVue2 from './demos/number-animation/NumberAnimationBasic.vue2?raw';
import numberAnimationBasicReact from './demos/number-animation/NumberAnimationBasic.react?raw';
</script>

# Number Animation 数字动画

动画数字显示组件，可在配置的持续时间内从一个值平滑过渡到另一个值。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="从 0 动画到 10000，持续 2 秒，并显示千位分隔符。" :code="numberAnimationBasicCode" :code-vue2="numberAnimationBasicVue2" :code-react="numberAnimationBasicReact">
  <NumberAnimationBasic />
</DemoBox>

## API 参考

### 属性 (Props)

| 属性            | 类型      | 默认值  | 说明                 |
| --------------- | --------- | ------- | -------------------- |
| `from`          | `number`  | `0`     | 起始值               |
| `to`            | `number`  | `0`     | 目标值               |
| `duration`      | `number`  | `2000`  | 动画持续时间（毫秒） |
| `precision`     | `number`  | `0`     | 小数精度             |
| `active`        | `boolean` | `true`  | 动画是否正在运行     |
| `showSeparator` | `boolean` | `false` | 显示千位分隔符       |
| `locale`        | `string`  | —       | 数字格式化的区域设置 |
