<script setup>
import NotificationBasic from './demos/notification/NotificationBasic.vue';
import notificationBasicCode from './demos/notification/NotificationBasic.vue?raw';
import notificationBasicVue2 from './demos/notification/NotificationBasic.vue2?raw';
import notificationBasicReact from './demos/notification/NotificationBasic.react?raw';
</script>

# Notification 通知

带标题和描述的富文本卡片式通知，使用命令式 API。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="点击按钮触发不同类型的通知。" :code="notificationBasicCode" :code-vue2="notificationBasicVue2" :code-react="notificationBasicReact">
  <NotificationBasic />
</DemoBox>

## API 参考

### useNotification() 方法

| 方法         | 载荷                                     | 说明     |
| ------------ | ---------------------------------------- | -------- |
| `.info()`    | `{ title: string, description: string }` | 信息通知 |
| `.success()` | `{ title: string, description: string }` | 成功通知 |
| `.warning()` | `{ title: string, description: string }` | 警告通知 |
| `.error()`   | `{ title: string, description: string }` | 错误通知 |
