<script setup>
import ElementBasic from './demos/element/ElementBasic.vue';
import elementBasicCode from './demos/element/ElementBasic.vue?raw';
import elementBasicVue2 from './demos/element/ElementBasic.vue2?raw';
import elementBasicReact from './demos/element/ElementBasic.react?raw';
</script>

# Element 元素

通用的 Chronix 主题 HTML 元素包装器，支持自定义标签名。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## 基础用法

<DemoBox title="基础用法" description="使用 tag 属性渲染指定的 HTML 元素。" :code="elementBasicCode" :code-vue2="elementBasicVue2" :code-react="elementBasicReact">
  <ElementBasic />
</DemoBox>

## API 参考

### 属性 (Props)

| Prop     | 类型      | 默认值   | 描述                 |
| -------- | --------- | -------- | -------------------- |
| `tag`    | `string`  | `'span'` | 要渲染的 HTML 标签名 |
| `inline` | `boolean` | `false`  | 是否以内联元素显示   |

### 插槽 (Slots)

| Slot      | 描述     |
| --------- | -------- |
| `default` | 元素内容 |
