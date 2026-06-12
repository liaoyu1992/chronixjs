<script setup>
import ModalBasic from './demos/modal/ModalBasic.vue';
import modalBasicCode from './demos/modal/ModalBasic.vue?raw';
import modalBasicVue2 from './demos/modal/ModalBasic.vue2?raw';
import modalBasicReact from './demos/modal/ModalBasic.react?raw';
</script>

# Modal 模态框

通过 Portal 挂载的居中浮层面板，带有半透明遮罩、焦点陷阱、滚动锁定和 Escape 关闭功能。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="点击按钮打开模态框。" :code="modalBasicCode" :code-vue2="modalBasicVue2" :code-react="modalBasicReact">
  <ModalBasic />
</DemoBox>

## API 参考

### 属性 (Props)

| 属性           | 类型                   | 默认值      | 说明                                     |
| -------------- | ---------------------- | ----------- | ---------------------------------------- |
| `show`         | `boolean \| undefined` | `undefined` | 受控的显示状态（v-model）                |
| `title`        | `string \| undefined`  | `undefined` | 模态框标题                               |
| `mask`         | `boolean`              | `true`      | 显示半透明遮罩背景                       |
| `maskClosable` | `boolean`              | `true`      | 点击遮罩关闭                             |
| `escClosable`  | `boolean`              | `true`      | 按 Escape 键关闭                         |
| `width`        | `number \| string`     | `520`       | 面板宽度（数字 → px，字符串 → 原样使用） |
| `disabled`     | `boolean`              | `false`     | 阻止打开                                 |

### 事件 (Events)

| 事件          | 载荷                                | 说明               |
| ------------- | ----------------------------------- | ------------------ |
| `update:show` | `boolean`                           | 显示状态变化时触发 |
| `close`       | `'mask' \| 'esc' \| 'close-button'` | 关闭时携带关闭原因 |

### 插槽 (Slots)

| 插槽      | 说明                   |
| --------- | ---------------------- |
| `default` | 模态框主体内容         |
| `header`  | 自定义头部（替代标题） |
| `footer`  | 底部操作栏             |
