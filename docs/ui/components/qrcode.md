<script setup>
import QRCodeBasic from './demos/qrcode/QRCodeBasic.vue';
import qrcodeBasicCode from './demos/qrcode/QRCodeBasic.vue?raw';
import qrcodeBasicVue2 from './demos/qrcode/QRCodeBasic.vue2?raw';
import qrcodeBasicReact from './demos/qrcode/QRCodeBasic.react?raw';
</script>

# QR Code 二维码

二维码 SVG 渲染（需要可选的对等依赖 `qrcode-generator`）。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="使用 value 属性设置编码内容，size 属性设置尺寸。" :code="qrcodeBasicCode" :code-vue2="qrcodeBasicVue2" :code-react="qrcodeBasicReact">
  <QRCodeBasic />
</DemoBox>

## API 参考

### 属性 (Props)

| 属性                   | 类型                       | 默认值      | 说明                 |
| ---------------------- | -------------------------- | ----------- | -------------------- |
| `value`                | `string`                   | `''`        | 要编码的值           |
| `size`                 | `number`                   | `200`       | 正方形渲染尺寸（px） |
| `errorCorrectionLevel` | `'L' \| 'M' \| 'Q' \| 'H'` | `'M'`       | 纠错等级             |
| `foreground`           | `string`                   | `'#000000'` | 深色模块颜色         |
| `background`           | `string`                   | `'#ffffff'` | 浅色模块 / 背景颜色  |
