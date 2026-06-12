<script setup>
import MessageBasic from './demos/message/MessageBasic.vue';
import messageBasicCode from './demos/message/MessageBasic.vue?raw';
import messageBasicVue2 from './demos/message/MessageBasic.vue2?raw';
import messageBasicReact from './demos/message/MessageBasic.react?raw';
</script>

# Message 消息提示

轻量级行内通知组件，支持自动消失和命令式 API。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="点击按钮触发不同类型的消息提示。" :code="messageBasicCode" :code-vue2="messageBasicVue2" :code-react="messageBasicReact">
  <MessageBasic />
</DemoBox>

## API 参考

### useMessage() 方法

| 方法         | 载荷     | 说明     |
| ------------ | -------- | -------- |
| `.info()`    | `string` | 信息消息 |
| `.success()` | `string` | 成功消息 |
| `.warning()` | `string` | 警告消息 |
| `.error()`   | `string` | 错误消息 |
