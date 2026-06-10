import {
  defaultLayoutProps,
  ensureChronixLayoutStyles,
  resolveLayoutClassList,
} from '@chronixjs/ui';
import { defineComponent, h, type PropType } from 'vue';

import { ChronixLayoutSider } from './chronix-layout-sider.js';

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
      const detectedHasSider = children.some((vnode) => {
        const ctor = vnode.componentOptions?.Ctor as unknown;
        if (ctor === ChronixLayoutSider) return true;
        const opts = vnode.componentOptions;
        const proto =
          opts?.Ctor !== undefined ? (opts.Ctor as { options?: { name?: string } }) : undefined;
        return proto?.options?.name === 'ChronixLayoutSider';
      });
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
