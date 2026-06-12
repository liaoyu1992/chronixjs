<script setup>
import ImageBasic from '../../../ui/components/demos/image/ImageBasic.vue';
import imageBasicCode from '../../../ui/components/demos/image/ImageBasic.vue?raw';
import imageBasicVue2 from '../../../ui/components/demos/image/ImageBasic.vue2?raw';
import imageBasicReact from '../../../ui/components/demos/image/ImageBasic.react?raw';
</script>

# Image

An enhanced image component with lazy loading, fallback, and preview support.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="A simple image with src, alt, width, and height." :code="imageBasicCode" :code-vue2="imageBasicVue2" :code-react="imageBasicReact">
  <ImageBasic />
</DemoBox>

## API Reference

### Props

| Prop          | Type                                                       | Default     | Description             |
| ------------- | ---------------------------------------------------------- | ----------- | ----------------------- |
| `src`         | `string`                                                   | `''`        | Image source URL        |
| `alt`         | `string`                                                   | `undefined` | Alt text                |
| `width`       | `number \| string`                                         | `undefined` | Image width             |
| `height`      | `number \| string`                                         | `undefined` | Image height            |
| `objectFit`   | `'fill' \| 'contain' \| 'cover' \| 'none' \| 'scale-down'` | `'cover'`   | CSS object-fit          |
| `previewable` | `boolean`                                                  | `false`     | Enable lightbox preview |
| `lazy`        | `boolean`                                                  | `true`      | Native lazy loading     |
| `fallback`    | `string`                                                   | `undefined` | Fallback src on error   |
