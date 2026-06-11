<script setup>
import MarqueeBasic from '../../../ui/components/demos/marquee/MarqueeBasic.vue';
import marqueeBasicCode from '../../../ui/components/demos/marquee/MarqueeBasic.vue?raw';
import marqueeBasicVue2 from '../../../ui/components/demos/marquee/MarqueeBasic.vue2?raw';
import marqueeBasicReact from '../../../ui/components/demos/marquee/MarqueeBasic.react?raw';
</script>

# Marquee

Auto-scrolling content strip for stock-tickers, sports scores, or promo announcements.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Left direction with pause on hover." :code="marqueeBasicCode" :code-vue2="marqueeBasicVue2" :code-react="marqueeBasicReact">
  <MarqueeBasic />
</DemoBox>

## API Reference

### Props

| Prop           | Type                                  | Default  | Description                |
| -------------- | ------------------------------------- | -------- | -------------------------- |
| `direction`    | `'left' \| 'right' \| 'up' \| 'down'` | `'left'` | Scrolling direction        |
| `speed`        | `number`                              | `50`     | Speed in pixels per second |
| `pauseOnHover` | `boolean`                             | `false`  | Pause animation on hover   |

### Slots

| Slot      | Description       |
| --------- | ----------------- |
| `default` | Scrolling content |
