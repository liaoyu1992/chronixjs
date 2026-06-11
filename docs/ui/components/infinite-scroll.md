<script setup>
import InfiniteScrollBasic from './demos/infinite-scroll/InfiniteScrollBasic.vue';
import infiniteScrollBasicCode from './demos/infinite-scroll/InfiniteScrollBasic.vue?raw';
import infiniteScrollBasicVue2 from './demos/infinite-scroll/InfiniteScrollBasic.vue2?raw';
import infiniteScrollBasicReact from './demos/infinite-scroll/InfiniteScrollBasic.react?raw';
</script>

# Infinite Scroll 无限滚动

当用户滚动到底部附近时发出加载更多事件的容器组件。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## 基础用法

<DemoBox title="基础用法" description="滚动到底部时自动加载更多数据。" :code="infiniteScrollBasicCode" :code-vue2="infiniteScrollBasicVue2" :code-react="infiniteScrollBasicReact">
  <InfiniteScrollBasic />
</DemoBox>

## API 参考

### 属性 (Props)

| Prop       | 类型      | 默认值  | 描述                     |
| ---------- | --------- | ------- | ------------------------ |
| `distance` | `number`  | `0`     | 距底部多少像素时触发加载 |
| `loading`  | `boolean` | `false` | 是否正在加载更多内容     |

### 事件 (Events)

| Event  | Payload | 描述                     |
| ------ | ------- | ------------------------ |
| `load` | —       | 用户滚动到底部附近时触发 |

### 插槽 (Slots)

| Slot      | 描述         |
| --------- | ------------ |
| `default` | 可滚动的内容 |
