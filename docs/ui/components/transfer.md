<script setup>
import TransferBasic from './demos/transfer/TransferBasic.vue';
import transferBasicCode from './demos/transfer/TransferBasic.vue?raw';
import transferBasicVue2 from './demos/transfer/TransferBasic.vue2?raw';
import transferBasicReact from './demos/transfer/TransferBasic.react?raw';
</script>

# Transfer 穿梭框

双面板穿梭组件，用于在源列表和目标列表之间移动选项。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="在源面板和目标面板之间移动选项。" :code="transferBasicCode" :code-vue2="transferBasicVue2" :code-react="transferBasicReact">
  <TransferBasic />
</DemoBox>

## API 参考

### 属性 (Props)

| 属性      | 类型                   | 默认值 | 说明       |
| --------- | ---------------------- | ------ | ---------- |
| `value`   | `(string \| number)[]` | `[]`   | 目标列表值 |
| `options` | `TransferOption[]`     | `[]`   | 所有选项   |

### 事件 (Events)

| 事件           | 载荷    | 说明         |
| -------------- | ------- | ------------ |
| `update:value` | `any[]` | 值变化时触发 |
