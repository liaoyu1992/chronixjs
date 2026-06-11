<script setup>
import ButtonBasic from './demos/button/ButtonBasic.vue';
import buttonBasicCode from './demos/button/ButtonBasic.vue?raw';
import buttonBasicVue2 from './demos/button/ButtonBasic.vue2?raw';
import buttonBasicReact from './demos/button/ButtonBasic.react?raw';
import ButtonSizes from './demos/button/ButtonSizes.vue';
import buttonSizesCode from './demos/button/ButtonSizes.vue?raw';
import buttonSizesVue2 from './demos/button/ButtonSizes.vue2?raw';
import buttonSizesReact from './demos/button/ButtonSizes.react?raw';
import ButtonDisabled from './demos/button/ButtonDisabled.vue';
import buttonDisabledCode from './demos/button/ButtonDisabled.vue?raw';
import buttonDisabledVue2 from './demos/button/ButtonDisabled.vue2?raw';
import buttonDisabledReact from './demos/button/ButtonDisabled.react?raw';
import ButtonBlock from './demos/button/ButtonBlock.vue';
import buttonBlockCode from './demos/button/ButtonBlock.vue?raw';
import buttonBlockVue2 from './demos/button/ButtonBlock.vue2?raw';
import buttonBlockReact from './demos/button/ButtonBlock.react?raw';
</script>

# Button 按钮

功能丰富的按钮组件，支持多种类型、尺寸和状态。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="按钮的基础用法。" :code="buttonBasicCode" :code-vue2="buttonBasicVue2" :code-react="buttonBasicReact">
  <ButtonBasic />
</DemoBox>

## 尺寸

<DemoBox title="尺寸" description="通过 size 属性设置按钮尺寸。" :code="buttonSizesCode" :code-vue2="buttonSizesVue2" :code-react="buttonSizesReact">
  <ButtonSizes />
</DemoBox>

## 禁用状态

<DemoBox title="禁用状态" description="通过 disabled 属性禁用按钮。" :code="buttonDisabledCode" :code-vue2="buttonDisabledVue2" :code-react="buttonDisabledReact">
  <ButtonDisabled />
</DemoBox>

## 块级按钮

<DemoBox title="块级按钮" description="通过 block 属性使按钮占满整行宽度。" :code="buttonBlockCode" :code-vue2="buttonBlockVue2" :code-react="buttonBlockReact">
  <ButtonBlock />
</DemoBox>

## API 参考

### 属性 (Props)

| 属性       | 类型                              | 默认值      | 说明             |
| ---------- | --------------------------------- | ----------- | ---------------- |
| `variant`  | `'default' \| 'primary'`          | `'default'` | 按钮样式类型     |
| `size`     | `'small' \| 'medium' \| 'large'`  | `'medium'`  | 按钮尺寸         |
| `disabled` | `boolean`                         | `false`     | 禁用按钮         |
| `block`    | `boolean`                         | `false`     | 撑满整行宽度     |
| `htmlType` | `'button' \| 'submit' \| 'reset'` | `'button'`  | 原生 button 类型 |

### 事件 (Events)

| 事件    | 载荷         | 说明       |
| ------- | ------------ | ---------- |
| `click` | `MouseEvent` | 点击时触发 |
