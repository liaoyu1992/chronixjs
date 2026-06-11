<script setup>
import CarouselBasic from '../../../ui/components/demos/carousel/CarouselBasic.vue';
import carouselBasicCode from '../../../ui/components/demos/carousel/CarouselBasic.vue?raw';
import carouselBasicVue2 from '../../../ui/components/demos/carousel/CarouselBasic.vue2?raw';
import carouselBasicReact from '../../../ui/components/demos/carousel/CarouselBasic.react?raw';
</script>

# Carousel

A slide carousel with optional autoplay, indicator dots, prev/next arrows, and thumbnail strip.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Carousel" description="3 slides with indicator dots shown." :code="carouselBasicCode" :code-vue2="carouselBasicVue2" :code-react="carouselBasicReact">
  <CarouselBasic />
</DemoBox>

## API Reference

### Props

| Prop         | Type                         | Default        | Description                             |
| ------------ | ---------------------------- | -------------- | --------------------------------------- |
| `value`      | `number`                     | `0`            | Currently active slide index (0-based)  |
| `items`      | `readonly CarouselItem[]`    | `[]`           | Array of slide items                    |
| `autoplay`   | `boolean`                    | `false`        | Enable automatic slide transition       |
| `intervalMs` | `number`                     | `3000`         | Autoplay interval in ms                 |
| `showDots`   | `boolean`                    | `true`         | Show indicator dots                     |
| `showArrows` | `boolean`                    | `true`         | Show prev/next arrows                   |
| `loop`       | `boolean`                    | `true`         | Wrap from last to first slide           |
| `direction`  | `'horizontal' \| 'vertical'` | `'horizontal'` | Slide direction                         |
| `lazy`       | `boolean`                    | `false`        | Render only active ± adjacent slides    |
| `thumbnails` | `boolean`                    | `false`        | Show thumbnail strip below the viewport |

### CarouselItem

| Property         | Type     | Description                            |
| ---------------- | -------- | -------------------------------------- |
| `key`            | `string` | Unique identifier                      |
| `content`        | `string` | Plain-text panel content               |
| `thumbnailLabel` | `string` | Optional label for the thumbnail strip |

### Events

| Event          | Payload                  | Description                       |
| -------------- | ------------------------ | --------------------------------- |
| `update:value` | `number`                 | Fires when active index changes   |
| `change`       | `(CarouselItem, number)` | Fires with the item and new index |
