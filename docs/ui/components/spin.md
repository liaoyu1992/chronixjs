<script setup>
import SpinBasic from './demos/spin/SpinBasic.vue';
import spinBasicCode from './demos/spin/SpinBasic.vue?raw';
import spinBasicVue2 from './demos/spin/SpinBasic.vue2?raw';
import spinBasicReact from './demos/spin/SpinBasic.react?raw';
import SpinSizes from './demos/spin/SpinSizes.vue';
import spinSizesCode from './demos/spin/SpinSizes.vue?raw';
import spinSizesVue2 from './demos/spin/SpinSizes.vue2?raw';
import spinSizesReact from './demos/spin/SpinSizes.react?raw';
</script>

# Spin 加载

带不确定旋转动画和可选描述文本的加载状态指示器。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="带描述文本的加载指示器。" :code="spinBasicCode" :code-vue2="spinBasicVue2" :code-react="spinBasicReact">
  <SpinBasic />
</DemoBox>

## 尺寸

<DemoBox title="尺寸" description="通过 size 属性设置加载指示器大小。" :code="spinSizesCode" :code-vue2="spinSizesVue2" :code-react="spinSizesReact">
  <SpinSizes />
</DemoBox>

## API 参考

### 属性 (Props)

| 属性          | 类型                             | 默认值      | 说明                 |
| ------------- | -------------------------------- | ----------- | -------------------- |
| `size`        | `'small' \| 'medium' \| 'large'` | `'medium'`  | 加载指示器大小       |
| `show`        | `boolean`                        | `true`      | 切换可见性（不卸载） |
| `description` | `string \| undefined`            | `undefined` | 加载指示器下方文字   |
