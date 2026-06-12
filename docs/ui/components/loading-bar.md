<script setup>
import LoadingBarBasic from './demos/loading-bar/LoadingBarBasic.vue';
import loadingBarBasicCode from './demos/loading-bar/LoadingBarBasic.vue?raw';
import loadingBarBasicVue2 from './demos/loading-bar/LoadingBarBasic.vue2?raw';
import loadingBarBasicReact from './demos/loading-bar/LoadingBarBasic.react?raw';
</script>

# Loading Bar 加载条

固定在视口顶部的命令式加载条，通过状态指示进度。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="通过状态控制加载条的显示。" :code="loadingBarBasicCode" :code-vue2="loadingBarBasicVue2" :code-react="loadingBarBasicReact">
  <LoadingBarBasic />
</DemoBox>

## API 参考

### LoadingBarState

| 值            | 描述                     |
| ------------- | ------------------------ |
| `'idle'`      | 加载条隐藏               |
| `'loading'`   | 加载条在顶部动画显示     |
| `'finishing'` | 加载条完成并淡出         |
| `'error'`     | 加载条显示错误颜色并淡出 |
