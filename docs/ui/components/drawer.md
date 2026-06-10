# Drawer 抽屉

从视口边缘滑入的面板，带有遮罩层。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## 基础用法

::: code-group

```vue [Vue 3]
<template>
  <div>
    <CxButton @click="show = true">Open Drawer</CxButton>
    <CxDrawer v-model:show="show" title="Drawer Title">
      <p>Drawer body content goes here.</p>
    </CxDrawer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxDrawer, CxButton } from '@chronixjs/ui-vue3';

const show = ref(false);
</script>
```

```vue [Vue 2]
<template>
  <div>
    <CxButton @click="show = true">Open Drawer</CxButton>
    <CxDrawer :show.sync="show" title="Drawer Title">
      <p>Drawer body content goes here.</p>
    </CxDrawer>
  </div>
</template>

<script>
import { CxDrawer, CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxDrawer, CxButton },
  data() {
    return {
      show: false,
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxDrawer, CxButton } from '@chronixjs/ui-react';

export function App() {
  const [show, setShow] = useState(false);

  return (
    <div>
      <CxButton onClick={() => setShow(true)}>Open Drawer</CxButton>
      <CxDrawer show={show} onUpdateShow={setShow} title="Drawer Title">
        <p>Drawer body content goes here.</p>
      </CxDrawer>
    </div>
  );
}
```

:::

## 弹出方向

抽屉从 `placement` 指定的视口边缘滑入。默认为 `right`（右侧）。

### 左侧

::: code-group

```vue [Vue 3]
<template>
  <div>
    <CxButton @click="show = true">Left Drawer</CxButton>
    <CxDrawer v-model:show="show" placement="left" title="Left Drawer">
      <p>This drawer slides in from the left.</p>
    </CxDrawer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxDrawer, CxButton } from '@chronixjs/ui-vue3';

const show = ref(false);
</script>
```

```vue [Vue 2]
<template>
  <div>
    <CxButton @click="show = true">Left Drawer</CxButton>
    <CxDrawer :show.sync="show" placement="left" title="Left Drawer">
      <p>This drawer slides in from the left.</p>
    </CxDrawer>
  </div>
</template>

<script>
import { CxDrawer, CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxDrawer, CxButton },
  data() {
    return {
      show: false,
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxDrawer, CxButton } from '@chronixjs/ui-react';

export function App() {
  const [show, setShow] = useState(false);

  return (
    <div>
      <CxButton onClick={() => setShow(true)}>Left Drawer</CxButton>
      <CxDrawer show={show} onUpdateShow={setShow} placement="left" title="Left Drawer">
        <p>This drawer slides in from the left.</p>
      </CxDrawer>
    </div>
  );
}
```

:::

### 顶部

::: code-group

```vue [Vue 3]
<template>
  <div>
    <CxButton @click="show = true">Top Drawer</CxButton>
    <CxDrawer v-model:show="show" placement="top" title="Top Drawer">
      <p>This drawer slides in from the top.</p>
    </CxDrawer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxDrawer, CxButton } from '@chronixjs/ui-vue3';

const show = ref(false);
</script>
```

```vue [Vue 2]
<template>
  <div>
    <CxButton @click="show = true">Top Drawer</CxButton>
    <CxDrawer :show.sync="show" placement="top" title="Top Drawer">
      <p>This drawer slides in from the top.</p>
    </CxDrawer>
  </div>
</template>

<script>
import { CxDrawer, CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxDrawer, CxButton },
  data() {
    return {
      show: false,
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxDrawer, CxButton } from '@chronixjs/ui-react';

export function App() {
  const [show, setShow] = useState(false);

  return (
    <div>
      <CxButton onClick={() => setShow(true)}>Top Drawer</CxButton>
      <CxDrawer show={show} onUpdateShow={setShow} placement="top" title="Top Drawer">
        <p>This drawer slides in from the top.</p>
      </CxDrawer>
    </div>
  );
}
```

:::

### 底部

::: code-group

```vue [Vue 3]
<template>
  <div>
    <CxButton @click="show = true">Bottom Drawer</CxButton>
    <CxDrawer v-model:show="show" placement="bottom" title="Bottom Drawer">
      <p>This drawer slides in from the bottom.</p>
    </CxDrawer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxDrawer, CxButton } from '@chronixjs/ui-vue3';

const show = ref(false);
</script>
```

```vue [Vue 2]
<template>
  <div>
    <CxButton @click="show = true">Bottom Drawer</CxButton>
    <CxDrawer :show.sync="show" placement="bottom" title="Bottom Drawer">
      <p>This drawer slides in from the bottom.</p>
    </CxDrawer>
  </div>
</template>

<script>
import { CxDrawer, CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxDrawer, CxButton },
  data() {
    return {
      show: false,
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxDrawer, CxButton } from '@chronixjs/ui-react';

export function App() {
  const [show, setShow] = useState(false);

  return (
    <div>
      <CxButton onClick={() => setShow(true)}>Bottom Drawer</CxButton>
      <CxDrawer show={show} onUpdateShow={setShow} placement="bottom" title="Bottom Drawer">
        <p>This drawer slides in from the bottom.</p>
      </CxDrawer>
    </div>
  );
}
```

:::

## 自定义尺寸

左右抽屉使用 `width` 属性，上下抽屉使用 `height` 属性。

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; gap: 8px;">
    <CxButton @click="showWide = true">Wide Drawer (600px)</CxButton>
    <CxButton @click="showTall = true">Tall Drawer (300px)</CxButton>

    <CxDrawer v-model:show="showWide" placement="right" title="Wide Drawer" :width="600">
      <p>This drawer is 600px wide.</p>
    </CxDrawer>

    <CxDrawer v-model:show="showTall" placement="top" title="Tall Drawer" :height="300">
      <p>This drawer is 300px tall.</p>
    </CxDrawer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxDrawer, CxButton } from '@chronixjs/ui-vue3';

const showWide = ref(false);
const showTall = ref(false);
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; gap: 8px;">
    <CxButton @click="showWide = true">Wide Drawer (600px)</CxButton>
    <CxButton @click="showTall = true">Tall Drawer (300px)</CxButton>

    <CxDrawer :show.sync="showWide" placement="right" title="Wide Drawer" :width="600">
      <p>This drawer is 600px wide.</p>
    </CxDrawer>

    <CxDrawer :show.sync="showTall" placement="top" title="Tall Drawer" :height="300">
      <p>This drawer is 300px tall.</p>
    </CxDrawer>
  </div>
</template>

<script>
import { CxDrawer, CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxDrawer, CxButton },
  data() {
    return {
      showWide: false,
      showTall: false,
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxDrawer, CxButton } from '@chronixjs/ui-react';

export function App() {
  const [showWide, setShowWide] = useState(false);
  const [showTall, setShowTall] = useState(false);

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <CxButton onClick={() => setShowWide(true)}>Wide Drawer (600px)</CxButton>
      <CxButton onClick={() => setShowTall(true)}>Tall Drawer (300px)</CxButton>

      <CxDrawer
        show={showWide}
        onUpdateShow={setShowWide}
        placement="right"
        title="Wide Drawer"
        width={600}
      >
        <p>This drawer is 600px wide.</p>
      </CxDrawer>

      <CxDrawer
        show={showTall}
        onUpdateShow={setShowTall}
        placement="top"
        title="Tall Drawer"
        height={300}
      >
        <p>This drawer is 300px tall.</p>
      </CxDrawer>
    </div>
  );
}
```

:::

## 无遮罩

禁用背景遮罩层，并阻止点击遮罩关闭。

::: code-group

```vue [Vue 3]
<template>
  <div>
    <CxButton @click="show = true">No Mask Drawer</CxButton>
    <CxDrawer v-model:show="show" title="No Mask" :mask="false" :mask-closable="false">
      <p>This drawer has no backdrop overlay.</p>
    </CxDrawer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxDrawer, CxButton } from '@chronixjs/ui-vue3';

const show = ref(false);
</script>
```

```vue [Vue 2]
<template>
  <div>
    <CxButton @click="show = true">No Mask Drawer</CxButton>
    <CxDrawer :show.sync="show" title="No Mask" :mask="false" :mask-closable="false">
      <p>This drawer has no backdrop overlay.</p>
    </CxDrawer>
  </div>
</template>

<script>
import { CxDrawer, CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxDrawer, CxButton },
  data() {
    return {
      show: false,
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxDrawer, CxButton } from '@chronixjs/ui-react';

export function App() {
  const [show, setShow] = useState(false);

  return (
    <div>
      <CxButton onClick={() => setShow(true)}>No Mask Drawer</CxButton>
      <CxDrawer
        show={show}
        onUpdateShow={setShow}
        title="No Mask"
        mask={false}
        maskClosable={false}
      >
        <p>This drawer has no backdrop overlay.</p>
      </CxDrawer>
    </div>
  );
}
```

:::

## API 参考

### 属性 (Props)

| 属性           | 类型                                     | 默认值      | 说明                  |
| -------------- | ---------------------------------------- | ----------- | --------------------- |
| `show`         | `boolean`                                | `undefined` | 受控的可见性          |
| `placement`    | `'left' \| 'right' \| 'top' \| 'bottom'` | `'right'`   | 滑入方向              |
| `title`        | `string`                                 | `undefined` | 抽屉标题              |
| `mask`         | `boolean`                                | `true`      | 显示背景遮罩          |
| `maskClosable` | `boolean`                                | `true`      | 点击遮罩关闭          |
| `escClosable`  | `boolean`                                | `true`      | 按 Escape 键关闭      |
| `width`        | `number \| string`                       | `400`       | 宽度（左侧/右侧抽屉） |
| `height`       | `number \| string`                       | `400`       | 高度（顶部/底部抽屉） |
| `disabled`     | `boolean`                                | `false`     | 禁用交互              |

### 事件 (Events)

| 事件          | 载荷                                | 说明             |
| ------------- | ----------------------------------- | ---------------- |
| `update:show` | `boolean`                           | 可见性变化时触发 |
| `close`       | `'mask' \| 'esc' \| 'close-button'` | 关闭原因         |

### 插槽 (Slots)

| 插槽      | 说明         |
| --------- | ------------ |
| `default` | 抽屉主体内容 |
