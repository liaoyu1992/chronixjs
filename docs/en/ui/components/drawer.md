# Drawer

A slide-in panel from the viewport edge with overlay.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

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

## Placements

The drawer slides in from the viewport edge specified by `placement`. The default is `right`.

### Left

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

### Top

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

### Bottom

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

## Custom Size

Use `width` for left/right drawers and `height` for top/bottom drawers.

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

## Without Mask

Disable the backdrop overlay and prevent closing on mask click.

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

## API Reference

### Props

| Prop           | Type                                     | Default     | Description           |
| -------------- | ---------------------------------------- | ----------- | --------------------- |
| `show`         | `boolean`                                | `undefined` | Controlled visibility |
| `placement`    | `'left' \| 'right' \| 'top' \| 'bottom'` | `'right'`   | Slide direction       |
| `title`        | `string`                                 | `undefined` | Drawer title          |
| `mask`         | `boolean`                                | `true`      | Show backdrop         |
| `maskClosable` | `boolean`                                | `true`      | Close on mask click   |
| `escClosable`  | `boolean`                                | `true`      | Close on Escape       |
| `width`        | `number \| string`                       | `400`       | Width (left/right)    |
| `height`       | `number \| string`                       | `400`       | Height (top/bottom)   |
| `disabled`     | `boolean`                                | `false`     | Disable interaction   |

### Events

| Event         | Payload                             | Description        |
| ------------- | ----------------------------------- | ------------------ |
| `update:show` | `boolean`                           | Visibility changed |
| `close`       | `'mask' \| 'esc' \| 'close-button'` | Close reason       |

### Slots

| Slot      | Description         |
| --------- | ------------------- |
| `default` | Drawer body content |
