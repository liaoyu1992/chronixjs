<script setup>
import SkeletonBasic from './demos/skeleton/SkeletonBasic.vue';
import skeletonBasicCode from './demos/skeleton/SkeletonBasic.vue?raw';
import skeletonBasicVue2 from './demos/skeleton/SkeletonBasic.vue2?raw';
import skeletonBasicReact from './demos/skeleton/SkeletonBasic.react?raw';
import SkeletonShapes from './demos/skeleton/SkeletonShapes.vue';
import skeletonShapesCode from './demos/skeleton/SkeletonShapes.vue?raw';
import skeletonShapesVue2 from './demos/skeleton/SkeletonShapes.vue2?raw';
import skeletonShapesReact from './demos/skeleton/SkeletonShapes.react?raw';
import SkeletonNoAnimation from './demos/skeleton/SkeletonNoAnimation.vue';
import skeletonNoAnimationCode from './demos/skeleton/SkeletonNoAnimation.vue?raw';
import skeletonNoAnimationVue2 from './demos/skeleton/SkeletonNoAnimation.vue2?raw';
import skeletonNoAnimationReact from './demos/skeleton/SkeletonNoAnimation.react?raw';
</script>

# Skeleton 骨架屏

用于内容加载状态的闪烁占位符。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="文本行骨架屏占位符。" :code="skeletonBasicCode" :code-vue2="skeletonBasicVue2" :code-react="skeletonBasicReact">
  <SkeletonBasic />
</DemoBox>

## 形状

<DemoBox title="形状" description="三种内置形状：text、rect、circle。" :code="skeletonShapesCode" :code-vue2="skeletonShapesVue2" :code-react="skeletonShapesReact">
  <SkeletonShapes />
</DemoBox>

## 无动画

<DemoBox title="无动画" description="设置 animated 为 false 禁用闪烁效果。" :code="skeletonNoAnimationCode" :code-vue2="skeletonNoAnimationVue2" :code-react="skeletonNoAnimationReact">
  <SkeletonNoAnimation />
</DemoBox>

## API 参考

### 属性 (Props)

| 属性       | 类型                           | 默认值      | 说明       |
| ---------- | ------------------------------ | ----------- | ---------- |
| `shape`    | `'text' \| 'rect' \| 'circle'` | `'text'`    | 骨架屏形状 |
| `width`    | `string \| number`             | `undefined` | 自定义宽度 |
| `height`   | `string \| number`             | `undefined` | 自定义高度 |
| `animated` | `boolean`                      | `true`      | 闪烁动画   |
| `round`    | `boolean`                      | `false`     | 胶囊形两端 |
