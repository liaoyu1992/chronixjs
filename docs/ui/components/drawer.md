<script setup>
import DrawerBasic from './demos/drawer/DrawerBasic.vue';
import drawerBasicCode from './demos/drawer/DrawerBasic.vue?raw';
import drawerBasicVue2 from './demos/drawer/DrawerBasic.vue2?raw';
import drawerBasicReact from './demos/drawer/DrawerBasic.react?raw';
</script>

# Drawer 抽屉

从视口边缘滑入的面板，带有遮罩层。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="点击按钮打开抽屉面板。" :code="drawerBasicCode" :code-vue2="drawerBasicVue2" :code-react="drawerBasicReact">
  <DrawerBasic />
</DemoBox>

## API 参考

### 属性 (Props)

| 属性        | 类型                | 默认值    | 说明                |
| ----------- | ------------------- | --------- | ------------------- |
| `show`      | `boolean`           | `false`   | 是否显示（v-model） |
| `title`     | `string`            | `''`      | 标题文本            |
| `placement` | `'left' \| 'right'` | `'right'` | 抽屉方向            |

### 事件 (Events)

| 事件          | 载荷      | 说明         |
| ------------- | --------- | ------------ |
| `update:show` | `boolean` | 显示状态变化 |

### 插槽 (Slots)

| 插槽      | 说明         |
| --------- | ------------ |
| `default` | 抽屉正文内容 |
