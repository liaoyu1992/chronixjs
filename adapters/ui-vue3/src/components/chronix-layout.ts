import {
  defaultLayoutProps,
  ensureChronixLayoutStyles,
  resolveLayoutClassList,
} from '@chronixjs/ui';
import { defineComponent, h, type PropType } from 'vue';

import { ChronixLayoutSider } from './chronix-layout-sider.js';

/**
 * `<ChronixLayout>` — Vue 3. Phase 28 (2026-06-04). Top-level layout
 * shell. Auto-detects `hasSider` by inspecting default-slot VNodes for
 * any `ChronixLayoutSider` instance. Consumer may also force the
 * detection explicitly via the `hasSider` prop.
 */
export const ChronixLayout = defineComponent({
  name: 'ChronixLayout',
  props: {
    hasSider: {
      type: Boolean as PropType<boolean | undefined>,
      default: undefined,
    },
    position: {
      type: String as PropType<'static' | 'absolute'>,
      default: defaultLayoutProps.position,
    },
  },
  setup(props, { slots }) {
    ensureChronixLayoutStyles();
    return () => {
      const children = slots['default']?.() ?? [];
      const detectedHasSider = children.some((vnode) => vnode.type === ChronixLayoutSider);
      const hasSider = props.hasSider ?? detectedHasSider;
      return h(
        'section',
        {
          class: resolveLayoutClassList({ hasSider, position: props.position }),
        },
        children,
      );
    };
  },
});
