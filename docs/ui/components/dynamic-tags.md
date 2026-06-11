<script setup>
import DynamicTagsBasic from './demos/dynamic-tags/DynamicTagsBasic.vue';
import dynamicTagsBasicCode from './demos/dynamic-tags/DynamicTagsBasic.vue?raw';
import dynamicTagsBasicVue2 from './demos/dynamic-tags/DynamicTagsBasic.vue2?raw';
import dynamicTagsBasicReact from './demos/dynamic-tags/DynamicTagsBasic.react?raw';
</script>

# Dynamic Tags 动态标签

内联标签编辑器，用户可以通过输入添加标签，并通过关闭图标移除标签。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## 基础用法

<DemoBox title="基础用法" description="动态标签的基础用法，初始包含 Tag 1 和 Tag 2。" :code="dynamicTagsBasicCode" :code-vue2="dynamicTagsBasicVue2" :code-react="dynamicTagsBasicReact">
  <DynamicTagsBasic />
</DemoBox>

## API 参考

### 属性 (Props)

| Prop       | 类型                  | 默认值      | 描述                       |
| ---------- | --------------------- | ----------- | -------------------------- |
| `value`    | `readonly string[]`   | `[]`        | 当前标签列表               |
| `max`      | `number \| undefined` | `undefined` | 最大标签数量               |
| `closable` | `boolean`             | `true`      | 是否显示每个标签的关闭图标 |
| `disabled` | `boolean`             | `false`     | 是否禁用编辑器             |

### 事件 (Events)

| Event          | Payload    | 描述           |
| -------------- | ---------- | -------------- |
| `update:value` | `string[]` | 标签变化时触发 |
