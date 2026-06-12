<script setup>
import EmptyBasic from './demos/empty/EmptyBasic.vue';
import emptyBasicCode from './demos/empty/EmptyBasic.vue?raw';
import emptyBasicVue2 from './demos/empty/EmptyBasic.vue2?raw';
import emptyBasicReact from './demos/empty/EmptyBasic.react?raw';
import EmptyDescription from './demos/empty/EmptyDescription.vue';
import emptyDescriptionCode from './demos/empty/EmptyDescription.vue?raw';
import emptyDescriptionVue2 from './demos/empty/EmptyDescription.vue2?raw';
import emptyDescriptionReact from './demos/empty/EmptyDescription.react?raw';
import EmptySizes from './demos/empty/EmptySizes.vue';
import emptySizesCode from './demos/empty/EmptySizes.vue?raw';
import emptySizesVue2 from './demos/empty/EmptySizes.vue2?raw';
import emptySizesReact from './demos/empty/EmptySizes.react?raw';
</script>

# Empty 空状态

空状态占位组件，包含图标和描述文本。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="使用默认描述的简单空状态。" :code="emptyBasicCode" :code-vue2="emptyBasicVue2" :code-react="emptyBasicReact">
  <EmptyBasic />
</DemoBox>

## 自定义描述

<DemoBox title="自定义描述" description="通过 description 属性设置自定义描述文本。" :code="emptyDescriptionCode" :code-vue2="emptyDescriptionVue2" :code-react="emptyDescriptionReact">
  <EmptyDescription />
</DemoBox>

## 尺寸

<DemoBox title="尺寸" description="使用 size 属性控制空状态的大小。" :code="emptySizesCode" :code-vue2="emptySizesVue2" :code-react="emptySizesReact">
  <EmptySizes />
</DemoBox>

## API 参考

### 属性 (Props)

| 属性          | 类型                             | 默认值      | 说明       |
| ------------- | -------------------------------- | ----------- | ---------- |
| `size`        | `'small' \| 'medium' \| 'large'` | `'medium'`  | 空状态大小 |
| `description` | `string`                         | `'No data'` | 描述文本   |

### 插槽 (Slots)

| 插槽      | 说明             |
| --------- | ---------------- |
| `default` | 底部额外操作区域 |
| `icon`    | 自定义图标内容   |
