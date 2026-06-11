<script setup>
import BackTopBasic from './demos/back-top/BackTopBasic.vue';
import backTopBasicCode from './demos/back-top/BackTopBasic.vue?raw';
import backTopBasicVue2 from './demos/back-top/BackTopBasic.vue2?raw';
import backTopBasicReact from './demos/back-top/BackTopBasic.react?raw';
</script>

# Back Top 回到顶部

当页面滚动超过指定阈值时出现的浮动"回到顶部"按钮。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="回到顶部" description="在可滚动区域内展示回到顶部按钮，滚动超过阈值后显示。" :code="backTopBasicCode" :code-vue2="backTopBasicVue2" :code-react="backTopBasicReact">
  <BackTopBasic />
</DemoBox>

## API 参考

### 属性 (Props)

| 属性                  | 类型                 | 默认值     | 说明                                |
| --------------------- | -------------------- | ---------- | ----------------------------------- |
| `visibilityThreshold` | `number`             | `100`      | 当 `scrollY >=` 此值时显示按钮      |
| `right`               | `number`             | `40`       | 距右侧偏移量（像素）                |
| `bottom`              | `number`             | `40`       | 距底部偏移量（像素）                |
| `behavior`            | `'smooth' \| 'auto'` | `'smooth'` | 传递给 `window.scrollTo` 的滚动行为 |

### 事件 (Events)

| 事件    | 载荷         | 说明             |
| ------- | ------------ | ---------------- |
| `click` | `MouseEvent` | 按钮被点击时触发 |

### 插槽 (Slots)

| 插槽      | 说明                        |
| --------- | --------------------------- |
| `default` | 自定义内容（默认为 ↑ 图标） |
