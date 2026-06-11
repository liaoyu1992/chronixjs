<script setup>
import QRCodeBasic from '../../../ui/components/demos/qrcode/QRCodeBasic.vue';
import qrcodeBasicCode from '../../../ui/components/demos/qrcode/QRCodeBasic.vue?raw';
import qrcodeBasicVue2 from '../../../ui/components/demos/qrcode/QRCodeBasic.vue2?raw';
import qrcodeBasicReact from '../../../ui/components/demos/qrcode/QRCodeBasic.react?raw';
</script>

# QR Code

QR code SVG rendering (requires optional `qrcode-generator` peer dependency).

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="A QR code with value and size props." :code="qrcodeBasicCode" :code-vue2="qrcodeBasicVue2" :code-react="qrcodeBasicReact">
  <QRCodeBasic />
</DemoBox>

## API Reference

### Props

| Prop                   | Type                       | Default     | Description                     |
| ---------------------- | -------------------------- | ----------- | ------------------------------- |
| `value`                | `string`                   | `''`        | Value to encode                 |
| `size`                 | `number`                   | `200`       | Square render size in px        |
| `errorCorrectionLevel` | `'L' \| 'M' \| 'Q' \| 'H'` | `'M'`       | Error correction level          |
| `foreground`           | `string`                   | `'#000000'` | Dark module color               |
| `background`           | `string`                   | `'#ffffff'` | Light module / background color |
