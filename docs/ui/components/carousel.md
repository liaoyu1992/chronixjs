<script setup>
import CarouselBasic from './demos/carousel/CarouselBasic.vue';
import carouselBasicCode from './demos/carousel/CarouselBasic.vue?raw';
import carouselBasicVue2 from './demos/carousel/CarouselBasic.vue2?raw';
import carouselBasicReact from './demos/carousel/CarouselBasic.react?raw';
</script>

# Carousel 走马灯

幻灯片轮播组件，支持自动播放、指示点、前进/后退箭头和缩略图条。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础走马灯" description="3 张幻灯片，显示指示点。" :code="carouselBasicCode" :code-vue2="carouselBasicVue2" :code-react="carouselBasicReact">
  <CarouselBasic />
</DemoBox>

## API 参考

### 属性 (Props)

| 属性         | 类型                         | 默认值         | 说明                              |
| ------------ | ---------------------------- | -------------- | --------------------------------- |
| `value`      | `number`                     | `0`            | 当前激活的幻灯片索引（从 0 开始） |
| `items`      | `readonly CarouselItem[]`    | `[]`           | 幻灯片项数组                      |
| `autoplay`   | `boolean`                    | `false`        | 启用自动切换                      |
| `intervalMs` | `number`                     | `3000`         | 自动播放间隔（毫秒）              |
| `showDots`   | `boolean`                    | `true`         | 显示指示点                        |
| `showArrows` | `boolean`                    | `true`         | 显示前进/后退箭头                 |
| `loop`       | `boolean`                    | `true`         | 从最后一张循环到第一张            |
| `direction`  | `'horizontal' \| 'vertical'` | `'horizontal'` | 滑动方向                          |
| `lazy`       | `boolean`                    | `false`        | 仅渲染当前及相邻的幻灯片          |
| `thumbnails` | `boolean`                    | `false`        | 在视口下方显示缩略图条            |

### CarouselItem

| 属性             | 类型     | 说明               |
| ---------------- | -------- | ------------------ |
| `key`            | `string` | 唯一标识符         |
| `content`        | `string` | 纯文本面板内容     |
| `thumbnailLabel` | `string` | 缩略图条的可选标签 |

### 事件 (Events)

| 事件           | 载荷                     | 说明                         |
| -------------- | ------------------------ | ---------------------------- |
| `update:value` | `number`                 | 激活索引变化时触发           |
| `change`       | `(CarouselItem, number)` | 幻灯片项和新的索引变化时触发 |
