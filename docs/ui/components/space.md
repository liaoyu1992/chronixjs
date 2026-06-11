<script setup>
import SpaceBasic from './demos/space/SpaceBasic.vue';
import spaceBasicCode from './demos/space/SpaceBasic.vue?raw';
import spaceBasicVue2 from './demos/space/SpaceBasic.vue2?raw';
import spaceBasicReact from './demos/space/SpaceBasic.react?raw';
import SpaceVertical from './demos/space/SpaceVertical.vue';
import spaceVerticalCode from './demos/space/SpaceVertical.vue?raw';
import spaceVerticalVue2 from './demos/space/SpaceVertical.vue2?raw';
import spaceVerticalReact from './demos/space/SpaceVertical.react?raw';
import SpaceSizes from './demos/space/SpaceSizes.vue';
import spaceSizesCode from './demos/space/SpaceSizes.vue?raw';
import spaceSizesVue2 from './demos/space/SpaceSizes.vue2?raw';
import spaceSizesReact from './demos/space/SpaceSizes.react?raw';
</script>

# Space 间距

一维布局原语，用于元素间的一致间距。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="水平排列子元素。" :code="spaceBasicCode" :code-vue2="spaceBasicVue2" :code-react="spaceBasicReact">
  <SpaceBasic />
</DemoBox>

## 垂直布局

<DemoBox title="垂直布局" description="使用 vertical 属性垂直排列子元素。" :code="spaceVerticalCode" :code-vue2="spaceVerticalVue2" :code-react="spaceVerticalReact">
  <SpaceVertical />
</DemoBox>

## 尺寸

<DemoBox title="尺寸" description="使用 size 属性设置预设间距。" :code="spaceSizesCode" :code-vue2="spaceSizesVue2" :code-react="spaceSizesReact">
  <SpaceSizes />
</DemoBox>

## API 参考

### 属性 (Props)

| 属性       | 类型                                                                                  | 默认值      | 说明           |
| ---------- | ------------------------------------------------------------------------------------- | ----------- | -------------- |
| `size`     | `'small' \| 'medium' \| 'large' \| number`                                            | `'medium'`  | 间距大小       |
| `vertical` | `boolean`                                                                             | `false`     | 垂直布局       |
| `wrap`     | `boolean`                                                                             | `true`      | 子元素换行     |
| `align`    | `'start' \| 'center' \| 'end' \| 'baseline' \| 'stretch'`                             | `undefined` | 交叉轴对齐     |
| `justify`  | `'start' \| 'center' \| 'end' \| 'space-around' \| 'space-between' \| 'space-evenly'` | `undefined` | 主轴对齐       |
| `inline`   | `boolean`                                                                             | `false`     | 行内 flex 模式 |
