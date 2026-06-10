import {
  defaultIconProps,
  ensureChronixIconStyles,
  getIcon,
  resolveIconClassList,
  resolveIconRenderMode,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type VNode } from 'vue';

export const ChronixIcon = defineComponent({
  name: 'ChronixIcon',
  props: {
    name: { type: String, default: defaultIconProps.name },
    size: { type: Number, default: defaultIconProps.size },
  },
  setup(props) {
    ensureChronixIconStyles();
    const resolvedProps = computed(() => ({ name: props.name, size: props.size }));
    return () => {
      const classList = resolveIconClassList(resolvedProps.value);
      const mode = resolveIconRenderMode(resolvedProps.value.name);
      if (mode === 'missing') {
        return h(
          'span',
          {
            class: classList,
            attrs: { 'aria-label': `missing icon: ${resolvedProps.value.name}` },
            style: {
              width: `${resolvedProps.value.size}px`,
              height: `${resolvedProps.value.size}px`,
              'line-height': `${resolvedProps.value.size}px`,
            },
          },
          '?',
        );
      }
      const spec = getIcon(resolvedProps.value.name)!;
      const pathNodes: VNode[] = spec.paths.map((p, idx) =>
        h('path', {
          key: idx,
          attrs: { d: p.d, 'fill-rule': p.fillRule ?? 'nonzero' },
        }),
      );
      return h(
        'svg',
        {
          class: classList,
          attrs: {
            viewBox: spec.viewBox,
            width: resolvedProps.value.size,
            height: resolvedProps.value.size,
            'aria-hidden': 'true',
          },
        },
        pathNodes,
      );
    };
  },
});
