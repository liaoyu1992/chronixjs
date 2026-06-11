<script setup>
import DialogBasic from './demos/dialog/DialogBasic.vue';
import dialogBasicCode from './demos/dialog/DialogBasic.vue?raw';
import dialogBasicVue2 from './demos/dialog/DialogBasic.vue2?raw';
import dialogBasicReact from './demos/dialog/DialogBasic.react?raw';
</script>

# Dialog 对话框

带有命令式 API 的模态对话框，用于确认和提示。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="通过命令式 API 打开确认对话框。" :code="dialogBasicCode" :code-vue2="dialogBasicVue2" :code-react="dialogBasicReact">
  <DialogBasic />
</DemoBox>

## API 参考

### useDiscreteDialog() 方法

| 方法         | 载荷            | 说明       |
| ------------ | --------------- | ---------- |
| `.info()`    | `DialogOptions` | 信息对话框 |
| `.success()` | `DialogOptions` | 成功对话框 |
| `.warning()` | `DialogOptions` | 警告对话框 |
| `.error()`   | `DialogOptions` | 错误对话框 |

### DialogOptions

| 属性           | 类型     | 说明         |
| -------------- | -------- | ------------ |
| `title`        | `string` | 标题         |
| `content`      | `string` | 内容         |
| `positiveText` | `string` | 确认按钮文本 |
| `negativeText` | `string` | 取消按钮文本 |
