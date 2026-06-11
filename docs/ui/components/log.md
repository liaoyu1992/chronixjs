<script setup>
import LogBasic from './demos/log/LogBasic.vue';
import logBasicCode from './demos/log/LogBasic.vue?raw';
import logBasicVue2 from './demos/log/LogBasic.vue2?raw';
import logBasicReact from './demos/log/LogBasic.react?raw';
</script>

# Log 日志

终端输出查看器，适用于 CI、部署、审计追踪或构建输出的展示。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="带有行号的日志输出。" :code="logBasicCode" :code-vue2="logBasicVue2" :code-react="logBasicReact">
  <LogBasic />
</DemoBox>

## API 参考

### 属性 (Props)

| Prop          | 类型                  | 默认值      | 描述                                 |
| ------------- | --------------------- | ----------- | ------------------------------------ |
| `lines`       | `readonly string[]`   | `[]`        | 按顺序渲染的行内容                   |
| `lineNumbers` | `boolean`             | `false`     | 是否显示行号                         |
| `loading`     | `boolean`             | `false`     | 是否在行下方显示 "loading..." 行     |
| `maxHeight`   | `number \| undefined` | `undefined` | 最大高度（像素），超出后变为滚动容器 |
| `wrapLines`   | `boolean`             | `false`     | 是否换行长行（`pre-wrap` 与 `pre`）  |
