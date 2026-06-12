<script setup>
import BackTopBasic from '../../../ui/components/demos/back-top/BackTopBasic.vue';
import backTopBasicCode from '../../../ui/components/demos/back-top/BackTopBasic.vue?raw';
import backTopBasicVue2 from '../../../ui/components/demos/back-top/BackTopBasic.vue2?raw';
import backTopBasicReact from '../../../ui/components/demos/back-top/BackTopBasic.react?raw';
</script>

# Back Top

A floating "back to top" button that appears when the page is scrolled past a threshold.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Back to Top" description="A back-to-top button inside a scrollable area, visible after scrolling past the threshold." :code="backTopBasicCode" :code-vue2="backTopBasicVue2" :code-react="backTopBasicReact">
  <BackTopBasic />
</DemoBox>

## API Reference

### Props

| Prop                  | Type                 | Default    | Description                                 |
| --------------------- | -------------------- | ---------- | ------------------------------------------- |
| `visibilityThreshold` | `number`             | `100`      | Show button when `scrollY >=` this value    |
| `right`               | `number`             | `40`       | Right offset in pixels                      |
| `bottom`              | `number`             | `40`       | Bottom offset in pixels                     |
| `behavior`            | `'smooth' \| 'auto'` | `'smooth'` | Scroll behavior passed to `window.scrollTo` |

### Events

| Event   | Payload      | Description                  |
| ------- | ------------ | ---------------------------- |
| `click` | `MouseEvent` | Fired when button is clicked |

### Slots

| Slot      | Description                         |
| --------- | ----------------------------------- |
| `default` | Custom content (defaults to ↑ icon) |
