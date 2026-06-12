<script setup>
import ProgressBasic from './demos/progress/ProgressBasic.vue';
import progressBasicCode from './demos/progress/ProgressBasic.vue?raw';
import progressBasicVue2 from './demos/progress/ProgressBasic.vue2?raw';
import progressBasicReact from './demos/progress/ProgressBasic.react?raw';
import ProgressTypes from './demos/progress/ProgressTypes.vue';
import progressTypesCode from './demos/progress/ProgressTypes.vue?raw';
import progressTypesVue2 from './demos/progress/ProgressTypes.vue2?raw';
import progressTypesReact from './demos/progress/ProgressTypes.react?raw';
import ProgressIndicator from './demos/progress/ProgressIndicator.vue';
import progressIndicatorCode from './demos/progress/ProgressIndicator.vue?raw';
import progressIndicatorVue2 from './demos/progress/ProgressIndicator.vue2?raw';
import progressIndicatorReact from './demos/progress/ProgressIndicator.react?raw';
import ProgressCustomHeight from './demos/progress/ProgressCustomHeight.vue';
import progressCustomHeightCode from './demos/progress/ProgressCustomHeight.vue?raw';
import progressCustomHeightVue2 from './demos/progress/ProgressCustomHeight.vue2?raw';
import progressCustomHeightReact from './demos/progress/ProgressCustomHeight.react?raw';
</script>

# Progress 进度条

带语义类型和可配置显示的线性进度条。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="线性进度条的基础用法。" :code="progressBasicCode" :code-vue2="progressBasicVue2" :code-react="progressBasicReact">
  <ProgressBasic />
</DemoBox>

## 进度条类型

<DemoBox title="进度条类型" description="使用 type 应用语义颜色。" :code="progressTypesCode" :code-vue2="progressTypesVue2" :code-react="progressTypesReact">
  <ProgressTypes />
</DemoBox>

## 指示器位置

<DemoBox title="指示器位置" description="控制百分比文本出现的位置。" :code="progressIndicatorCode" :code-vue2="progressIndicatorVue2" :code-react="progressIndicatorReact">
  <ProgressIndicator />
</DemoBox>

## 自定义高度

<DemoBox title="自定义高度" description="设置 height 属性来创建更粗或更细的进度条。" :code="progressCustomHeightCode" :code-vue2="progressCustomHeightVue2" :code-react="progressCustomHeightReact">
  <ProgressCustomHeight />
</DemoBox>

## API 参考

### 属性 (Props)

| 属性                 | 类型                                                       | 默认值      | 说明            |
| -------------------- | ---------------------------------------------------------- | ----------- | --------------- |
| `type`               | `'default' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'default'` | 进度条类型      |
| `percentage`         | `number`                                                   | `0`         | 进度值（0-100） |
| `showInfo`           | `boolean`                                                  | `true`      | 显示百分比文本  |
| `height`             | `number`                                                   | `undefined` | 轨道高度（px）  |
| `indicatorPlacement` | `'inside' \| 'outside'`                                    | `'outside'` | 文本位置        |
