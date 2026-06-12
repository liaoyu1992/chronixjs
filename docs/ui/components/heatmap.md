<script setup>
import HeatmapBasic from './demos/heatmap/HeatmapBasic.vue';
import heatmapBasicCode from './demos/heatmap/HeatmapBasic.vue?raw';
import heatmapBasicVue2 from './demos/heatmap/HeatmapBasic.vue2?raw';
import heatmapBasicReact from './demos/heatmap/HeatmapBasic.react?raw';
</script>

# Heatmap 热力图

SVG 单元格网格，在两个端点颜色之间进行线性颜色插值。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## 基础用法

<DemoBox title="基础用法" description="7x5 网格的热力图，展示数值分布。" :code="heatmapBasicCode" :code-vue2="heatmapBasicVue2" :code-react="heatmapBasicReact">
  <HeatmapBasic />
</DemoBox>

## API 参考

### 属性 (Props)

| Prop        | 类型                             | 默认值      | 描述               |
| ----------- | -------------------------------- | ----------- | ------------------ |
| `cells`     | `readonly (readonly number[])[]` | `[]`        | 数值型二维矩阵     |
| `cellSize`  | `number`                         | `20`        | 单元格宽高（像素） |
| `colorLow`  | `string`                         | `'#dbeafe'` | 最小值对应的颜色   |
| `colorHigh` | `string`                         | `'#1e3a8a'` | 最大值对应的颜色   |
