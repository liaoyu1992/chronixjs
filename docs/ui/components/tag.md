<script setup>
import TagBasic from './demos/tag/TagBasic.vue';
import tagBasicCode from './demos/tag/TagBasic.vue?raw';
import tagBasicVue2 from './demos/tag/TagBasic.vue2?raw';
import tagBasicReact from './demos/tag/TagBasic.react?raw';
import TagSizes from './demos/tag/TagSizes.vue';
import tagSizesCode from './demos/tag/TagSizes.vue?raw';
import tagSizesVue2 from './demos/tag/TagSizes.vue2?raw';
import tagSizesReact from './demos/tag/TagSizes.react?raw';
import TagClosable from './demos/tag/TagClosable.vue';
import tagClosableCode from './demos/tag/TagClosable.vue?raw';
import tagClosableVue2 from './demos/tag/TagClosable.vue2?raw';
import tagClosableReact from './demos/tag/TagClosable.react?raw';
import TagRound from './demos/tag/TagRound.vue';
import tagRoundCode from './demos/tag/TagRound.vue?raw';
import tagRoundVue2 from './demos/tag/TagRound.vue2?raw';
import tagRoundReact from './demos/tag/TagRound.react?raw';
import TagBordered from './demos/tag/TagBordered.vue';
import tagBorderedCode from './demos/tag/TagBordered.vue?raw';
import tagBorderedVue2 from './demos/tag/TagBordered.vue2?raw';
import tagBorderedReact from './demos/tag/TagBordered.react?raw';
import TagDisabled from './demos/tag/TagDisabled.vue';
import tagDisabledCode from './demos/tag/TagDisabled.vue?raw';
import tagDisabledVue2 from './demos/tag/TagDisabled.vue2?raw';
import tagDisabledReact from './demos/tag/TagDisabled.react?raw';
</script>

# Tag 标签

标签用于标记、分类和小型行内标记。支持语义颜色、尺寸、可关闭和胶囊形圆角。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="标签的六种语义类型。" :code="tagBasicCode" :code-vue2="tagBasicVue2" :code-react="tagBasicReact">
  <TagBasic />
</DemoBox>

## 尺寸

<DemoBox title="尺寸" description="通过 size 属性设置标签尺寸。" :code="tagSizesCode" :code-vue2="tagSizesVue2" :code-react="tagSizesReact">
  <TagSizes />
</DemoBox>

## 可关闭

<DemoBox title="可关闭" description="通过 closable 属性显示关闭按钮，监听 close 事件来移除标签。" :code="tagClosableCode" :code-vue2="tagClosableVue2" :code-react="tagClosableReact">
  <TagClosable />
</DemoBox>

## 胶囊形

<DemoBox title="胶囊形" description="通过 round 属性实现胶囊形标签。" :code="tagRoundCode" :code-vue2="tagRoundVue2" :code-react="tagRoundReact">
  <TagRound />
</DemoBox>

## 边框

<DemoBox title="边框" description="通过 bordered 属性控制是否显示边框。" :code="tagBorderedCode" :code-vue2="tagBorderedVue2" :code-react="tagBorderedReact">
  <TagBordered />
</DemoBox>

## 禁用状态

<DemoBox title="禁用状态" description="通过 disabled 属性禁用标签交互。" :code="tagDisabledCode" :code-vue2="tagDisabledVue2" :code-react="tagDisabledReact">
  <TagDisabled />
</DemoBox>

## API 参考

### 属性 (Props)

| 属性       | 类型                                                                    | 默认值      | 说明            |
| ---------- | ----------------------------------------------------------------------- | ----------- | --------------- |
| `type`     | `'default' \| 'primary' \| 'info' \| 'success' \| 'warning' \| 'error'` | `'default'` | 标签样式类型    |
| `size`     | `'small' \| 'medium' \| 'large'`                                        | `'medium'`  | 标签尺寸        |
| `bordered` | `boolean`                                                               | `true`      | 显示边框        |
| `round`    | `boolean`                                                               | `false`     | 胶囊形圆角      |
| `closable` | `boolean`                                                               | `false`     | 显示关闭按钮    |
| `disabled` | `boolean`                                                               | `false`     | 不可交互 + 变淡 |

### 事件 (Events)

| 事件    | 载荷         | 说明         |
| ------- | ------------ | ------------ |
| `close` | `MouseEvent` | 点击关闭按钮 |
