<script setup>
import SplitBasic from './demos/split/SplitBasic.vue';
import splitBasicCode from './demos/split/SplitBasic.vue?raw';
import splitBasicVue2 from './demos/split/SplitBasic.vue2?raw';
import splitBasicReact from './demos/split/SplitBasic.react?raw';
</script>

# Split 分割面板

双面板可调整大小的分割器。拖动面板间的分隔条来重新分配空间。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="水平分割面板的基础用法。" :code="splitBasicCode" :code-vue2="splitBasicVue2" :code-react="splitBasicReact">
  <SplitBasic />
</DemoBox>

## API 参考

### 属性 (Props)

| 属性          | 类型                            | 默认值         | 说明                     |
| ------------- | ------------------------------- | -------------- | ------------------------ |
| `direction`   | `'horizontal' \| 'vertical'`    | `'horizontal'` | 分割方向                 |
| `defaultSize` | `number \| string`              | `'50%'`        | 第一个面板的初始大小     |
| `size`        | `number \| string \| undefined` | `undefined`    | 受控的第一个面板大小覆盖 |
| `minSize`     | `number \| string`              | `0`            | 第一个面板最小大小       |
| `maxSize`     | `number \| string`              | `'100%'`       | 第一个面板最大大小       |
| `disabled`    | `boolean`                       | `false`        | 禁用拖拽调整大小         |

### 事件 (Events)

| 事件           | 载荷               | 说明                     |
| -------------- | ------------------ | ------------------------ |
| `update:size`  | `number \| string` | 第一个面板大小变化时触发 |
| `resize-start` | —                  | 拖拽开始时触发           |
| `resize-end`   | —                  | 拖拽结束时触发           |

### 插槽 (Slots)

| 插槽     | 说明           |
| -------- | -------------- |
| `first`  | 第一个面板内容 |
| `second` | 第二个面板内容 |
