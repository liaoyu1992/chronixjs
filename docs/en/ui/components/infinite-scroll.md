<script setup>
import InfiniteScrollBasic from '../../../ui/components/demos/infinite-scroll/InfiniteScrollBasic.vue';
import infiniteScrollBasicCode from '../../../ui/components/demos/infinite-scroll/InfiniteScrollBasic.vue?raw';
import infiniteScrollBasicVue2 from '../../../ui/components/demos/infinite-scroll/InfiniteScrollBasic.vue2?raw';
import infiniteScrollBasicReact from '../../../ui/components/demos/infinite-scroll/InfiniteScrollBasic.react?raw';
</script>

# Infinite Scroll

Container that emits a load-more event when the user scrolls near the bottom.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Automatically load more data when scrolling to the bottom." :code="infiniteScrollBasicCode" :code-vue2="infiniteScrollBasicVue2" :code-react="infiniteScrollBasicReact">
  <InfiniteScrollBasic />
</DemoBox>

## API Reference

### Props

| Prop       | Type      | Default | Description                           |
| ---------- | --------- | ------- | ------------------------------------- |
| `distance` | `number`  | `0`     | Distance in px from bottom to trigger |
| `loading`  | `boolean` | `false` | Whether more content is loading       |

### Events

| Event  | Payload | Description                         |
| ------ | ------- | ----------------------------------- |
| `load` | —       | Fires when user scrolls near bottom |

### Slots

| Slot      | Description        |
| --------- | ------------------ |
| `default` | Scrollable content |
