<script setup>
import SkeletonBasic from '../../../ui/components/demos/skeleton/SkeletonBasic.vue';
import skeletonBasicCode from '../../../ui/components/demos/skeleton/SkeletonBasic.vue?raw';
import skeletonBasicVue2 from '../../../ui/components/demos/skeleton/SkeletonBasic.vue2?raw';
import skeletonBasicReact from '../../../ui/components/demos/skeleton/SkeletonBasic.react?raw';
import SkeletonShapes from '../../../ui/components/demos/skeleton/SkeletonShapes.vue';
import skeletonShapesCode from '../../../ui/components/demos/skeleton/SkeletonShapes.vue?raw';
import skeletonShapesVue2 from '../../../ui/components/demos/skeleton/SkeletonShapes.vue2?raw';
import skeletonShapesReact from '../../../ui/components/demos/skeleton/SkeletonShapes.react?raw';
import SkeletonNoAnimation from '../../../ui/components/demos/skeleton/SkeletonNoAnimation.vue';
import skeletonNoAnimationCode from '../../../ui/components/demos/skeleton/SkeletonNoAnimation.vue?raw';
import skeletonNoAnimationVue2 from '../../../ui/components/demos/skeleton/SkeletonNoAnimation.vue2?raw';
import skeletonNoAnimationReact from '../../../ui/components/demos/skeleton/SkeletonNoAnimation.react?raw';
</script>

# Skeleton

A shimmering placeholder for content loading states.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Text-line skeleton placeholders." :code="skeletonBasicCode" :code-vue2="skeletonBasicVue2" :code-react="skeletonBasicReact">
  <SkeletonBasic />
</DemoBox>

## Shapes

<DemoBox title="Shapes" description="Three built-in shapes: text, rect, circle." :code="skeletonShapesCode" :code-vue2="skeletonShapesVue2" :code-react="skeletonShapesReact">
  <SkeletonShapes />
</DemoBox>

## Without Animation

<DemoBox title="Without Animation" description="Set animated to false to disable the shimmer effect." :code="skeletonNoAnimationCode" :code-vue2="skeletonNoAnimationVue2" :code-react="skeletonNoAnimationReact">
  <SkeletonNoAnimation />
</DemoBox>

## API Reference

### Props

| Prop       | Type                           | Default     | Description       |
| ---------- | ------------------------------ | ----------- | ----------------- |
| `shape`    | `'text' \| 'rect' \| 'circle'` | `'text'`    | Skeleton shape    |
| `width`    | `string \| number`             | `undefined` | Custom width      |
| `height`   | `string \| number`             | `undefined` | Custom height     |
| `animated` | `boolean`                      | `true`      | Shimmer animation |
| `round`    | `boolean`                      | `false`     | Pill-shaped ends  |
