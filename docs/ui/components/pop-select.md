<script setup>
import PopSelectBasic from './demos/pop-select/PopSelectBasic.vue';
import popSelectBasicCode from './demos/pop-select/PopSelectBasic.vue?raw';
import popSelectBasicVue2 from './demos/pop-select/PopSelectBasic.vue2?raw';
import popSelectBasicReact from './demos/pop-select/PopSelectBasic.react?raw';
</script>

# Pop Select 弹出选择

基于 Popover 封装的选项列表弹出面板，用于简单的下拉单选。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="点击触发，3 个选项的下拉选择。" :code="popSelectBasicCode" :code-vue2="popSelectBasicVue2" :code-react="popSelectBasicReact">
  <PopSelectBasic />
</DemoBox>

## API 参考

### 属性 (Props)

| 属性         | 类型                         | 默认值           | 说明                   |
| ------------ | ---------------------------- | ---------------- | ---------------------- |
| `value`      | `string \| undefined`        | `undefined`      | 选中的选项值           |
| `options`    | `readonly PopSelectOption[]` | `[]`             | 可用选项               |
| `show`       | `boolean \| undefined`       | `undefined`      | 受控的弹窗显示状态     |
| `trigger`    | `'click' \| 'hover'`         | `'click'`        | 弹窗触发模式           |
| `placement`  | `PopupPlacement`             | `'bottom-start'` | 弹出位置               |
| `offset`     | `number`                     | `4`              | 与触发元素的距离（px） |
| `flip`       | `boolean`                    | `true`           | 溢出时自动翻转         |
| `widthMatch` | `boolean`                    | `false`          | 匹配触发元素宽度       |
| `disabled`   | `boolean`                    | `false`          | 禁用选择器             |

### PopSelectOption

| 属性       | 类型      | 说明       |
| ---------- | --------- | ---------- |
| `key`      | `string`  | 唯一标识   |
| `label`    | `string`  | 显示文本   |
| `value`    | `string`  | 选项值     |
| `disabled` | `boolean` | 禁用此选项 |

### 事件 (Events)

| 事件           | 载荷      | 说明                   |
| -------------- | --------- | ---------------------- |
| `update:value` | `string`  | 选中值变化时触发       |
| `update:show`  | `boolean` | 弹窗显示状态变化时触发 |

### 插槽 (Slots)

| 插槽      | 说明     |
| --------- | -------- |
| `default` | 触发元素 |
