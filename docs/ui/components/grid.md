<script setup>
import GridBasic from './demos/grid/GridBasic.vue';
import gridBasicCode from './demos/grid/GridBasic.vue?raw';
import gridBasicVue2 from './demos/grid/GridBasic.vue2?raw';
import gridBasicReact from './demos/grid/GridBasic.react?raw';
</script>

# Grid 栅格布局

CSS Grid 二维布局容器，提供简化的列和间距配置。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="使用 Grid 创建 3 列等宽栅格布局。" :code="gridBasicCode" :code-vue2="gridBasicVue2" :code-react="gridBasicReact">
  <GridBasic />
</DemoBox>

## API 参考

### 属性 (Props)

| Prop     | 类型                            | 默认值      | 描述                                               |
| -------- | ------------------------------- | ----------- | -------------------------------------------------- |
| `cols`   | `number \| string \| undefined` | `undefined` | 列轨道：数字 → `repeat(N, 1fr)`，字符串 → 原样使用 |
| `xGap`   | `number \| undefined`           | `undefined` | 列间距（像素）                                     |
| `yGap`   | `number \| undefined`           | `undefined` | 行间距（像素）                                     |
| `inline` | `boolean`                       | `false`     | 使用 `inline-grid` 代替 `grid`                     |

### 插槽 (Slots)

| Slot      | 描述           |
| --------- | -------------- |
| `default` | 栅格单元格内容 |
