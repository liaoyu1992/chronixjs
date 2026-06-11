<script setup>
import TabsBasic from './demos/tabs/TabsBasic.vue';
import tabsBasicCode from './demos/tabs/TabsBasic.vue?raw';
import tabsBasicVue2 from './demos/tabs/TabsBasic.vue2?raw';
import tabsBasicReact from './demos/tabs/TabsBasic.react?raw';
import TabsCard from './demos/tabs/TabsCard.vue';
import tabsCardCode from './demos/tabs/TabsCard.vue?raw';
import tabsCardVue2 from './demos/tabs/TabsCard.vue2?raw';
import tabsCardReact from './demos/tabs/TabsCard.react?raw';
import TabsSegment from './demos/tabs/TabsSegment.vue';
import tabsSegmentCode from './demos/tabs/TabsSegment.vue?raw';
import tabsSegmentVue2 from './demos/tabs/TabsSegment.vue2?raw';
import tabsSegmentReact from './demos/tabs/TabsSegment.react?raw';
</script>

# Tabs 标签页

支持线条、卡片和分段变体的标签页界面。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="线条风格标签页。" :code="tabsBasicCode" :code-vue2="tabsBasicVue2" :code-react="tabsBasicReact">
  <TabsBasic />
</DemoBox>

## 卡片类型

<DemoBox title="卡片类型" description="使用 type=&quot;card&quot; 实现卡片风格的标签栏。" :code="tabsCardCode" :code-vue2="tabsCardVue2" :code-react="tabsCardReact">
  <TabsCard />
</DemoBox>

## 分段类型

<DemoBox title="分段类型" description="使用 type=&quot;segment&quot; 实现分段控制器风格。" :code="tabsSegmentCode" :code-vue2="tabsSegmentVue2" :code-react="tabsSegmentReact">
  <TabsSegment />
</DemoBox>

## API 参考

### 属性 (Props)

| 属性        | 类型                                     | 默认值      | 说明             |
| ----------- | ---------------------------------------- | ----------- | ---------------- |
| `value`     | `string`                                 | `undefined` | 激活的标签页键值 |
| `items`     | `TabItem[]`                              | `[]`        | 标签页项         |
| `type`      | `'line' \| 'card' \| 'segment'`          | `'line'`    | 视觉变体         |
| `placement` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'top'`     | 标签栏位置       |
| `size`      | `'small' \| 'medium' \| 'large'`         | `'medium'`  | 标签页尺寸       |
| `disabled`  | `boolean`                                | `false`     | 禁用标签页       |
| `addable`   | `boolean`                                | `false`     | 显示添加按钮     |
| `draggable` | `boolean`                                | `false`     | 启用拖拽排序     |

### 事件 (Events)

| 事件           | 载荷     | 说明           |
| -------------- | -------- | -------------- |
| `update:value` | `string` | 激活标签页变化 |
