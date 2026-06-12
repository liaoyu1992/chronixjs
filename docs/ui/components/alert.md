<script setup>
import AlertBasic from './demos/alert/AlertBasic.vue';
import alertBasicCode from './demos/alert/AlertBasic.vue?raw';
import alertBasicVue2 from './demos/alert/AlertBasic.vue2?raw';
import alertBasicReact from './demos/alert/AlertBasic.react?raw';
import AlertTypes from './demos/alert/AlertTypes.vue';
import alertTypesCode from './demos/alert/AlertTypes.vue?raw';
import alertTypesVue2 from './demos/alert/AlertTypes.vue2?raw';
import alertTypesReact from './demos/alert/AlertTypes.react?raw';
import AlertTitle from './demos/alert/AlertTitle.vue';
import alertTitleCode from './demos/alert/AlertTitle.vue?raw';
import alertTitleVue2 from './demos/alert/AlertTitle.vue2?raw';
import alertTitleReact from './demos/alert/AlertTitle.react?raw';
import AlertClosable from './demos/alert/AlertClosable.vue';
import alertClosableCode from './demos/alert/AlertClosable.vue?raw';
import alertClosableVue2 from './demos/alert/AlertClosable.vue2?raw';
import alertClosableReact from './demos/alert/AlertClosable.react?raw';
</script>

# Alert 警告

展示带有语义类型（info、success、warning、error）的重要消息。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="Alert 的基础用法。" :code="alertBasicCode" :code-vue2="alertBasicVue2" :code-react="alertBasicReact">
  <AlertBasic />
</DemoBox>

## 警告类型

<DemoBox title="警告类型" description="通过 type 属性设置不同的语义类型。" :code="alertTypesCode" :code-vue2="alertTypesVue2" :code-react="alertTypesReact">
  <AlertTypes />
</DemoBox>

## 带标题

<DemoBox title="带标题" description="通过 title 属性添加标题。" :code="alertTitleCode" :code-vue2="alertTitleVue2" :code-react="alertTitleReact">
  <AlertTitle />
</DemoBox>

## 可关闭

<DemoBox title="可关闭" description="通过 closable 属性显示关闭按钮。" :code="alertClosableCode" :code-vue2="alertClosableVue2" :code-react="alertClosableReact">
  <AlertClosable />
</DemoBox>

## API 参考

### 属性 (Props)

| 属性       | 类型                                                       | 默认值      | 说明           |
| ---------- | ---------------------------------------------------------- | ----------- | -------------- |
| `type`     | `'default' \| 'info' \| 'success' \| 'warning' \| 'error'` | `'default'` | 警告的语义类型 |
| `title`    | `string`                                                   | `undefined` | 可选标题文本   |
| `closable` | `boolean`                                                  | `false`     | 显示关闭按钮   |
| `bordered` | `boolean`                                                  | `true`      | 显示边框       |

### 事件 (Events)

| 事件    | 载荷         | 说明               |
| ------- | ------------ | ------------------ |
| `close` | `MouseEvent` | 点击关闭按钮时触发 |

### 插槽 (Slots)

| 插槽      | 说明         |
| --------- | ------------ |
| `default` | 警告正文内容 |
