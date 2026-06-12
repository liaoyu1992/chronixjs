<script setup>
import MarqueeBasic from './demos/marquee/MarqueeBasic.vue';
import marqueeBasicCode from './demos/marquee/MarqueeBasic.vue?raw';
import marqueeBasicVue2 from './demos/marquee/MarqueeBasic.vue2?raw';
import marqueeBasicReact from './demos/marquee/MarqueeBasic.react?raw';
</script>

# Marquee 跑马灯

自动滚动内容条，适用于股票行情、体育比分或促销公告。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="左方向滚动，鼠标悬停时暂停。" :code="marqueeBasicCode" :code-vue2="marqueeBasicVue2" :code-react="marqueeBasicReact">
  <MarqueeBasic />
</DemoBox>

## API 参考

### 属性 (Props)

| Prop           | 类型                                  | 默认值   | 描述               |
| -------------- | ------------------------------------- | -------- | ------------------ |
| `direction`    | `'left' \| 'right' \| 'up' \| 'down'` | `'left'` | 滚动方向           |
| `speed`        | `number`                              | `50`     | 速度（像素/秒）    |
| `pauseOnHover` | `boolean`                             | `false`  | 鼠标悬停时暂停动画 |

### 插槽 (Slots)

| Slot      | 描述     |
| --------- | -------- |
| `default` | 滚动内容 |
