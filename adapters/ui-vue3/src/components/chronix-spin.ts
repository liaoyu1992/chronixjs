import {
  defaultSpinProps,
  ensureChronixSpinStyles,
  resolveSpinClassList,
  type SpinProps,
  type SpinSize,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';

import { useUIContext } from '../composables/use-ui-context.js';

/**
 * `<ChronixSpin>` — Vue 3 SFC wrapping the core `SpinProps` IR.
 *
 * Phase 16 (2026-06-02). Tier A loading-state primitive.
 *
 * Props:
 *
 * - `size` — `'small' | 'medium' | 'large'`. Default `undefined`,
 *   falls back to `ChronixUIContext.size` (Phase 0.3 Decision A.1
 *   precedence). The interface default is `'medium'`.
 * - `show` — `boolean`. Default `true`. `false` hides the spin
 *   (display: none) without unmounting (preserves animation state).
 * - `description` — `string | undefined`. Optional text below the
 *   indicator.
 *
 * Slots:
 *
 * - `default` — currently unused (the "wrap-children with overlay
 *   spinner" form is out of scope for Phase 16). Reserved for future
 *   extension.
 */
export const ChronixSpin = defineComponent({
  name: 'ChronixSpin',
  props: {
    size: {
      type: String as PropType<SpinSize | undefined>,
      default: undefined,
    },
    show: {
      type: Boolean,
      default: defaultSpinProps.show,
    },
    description: {
      type: String as PropType<string | undefined>,
      default: defaultSpinProps.description,
    },
  },
  setup(props) {
    ensureChronixSpinStyles();
    const ctx = useUIContext();

    const resolvedProps = computed<SpinProps>(() => ({
      size: props.size ?? ctx.value.size,
      show: props.show,
      description: props.description,
    }));

    return () => {
      const classList = resolveSpinClassList(resolvedProps.value);
      const children: VNode[] = [
        h('div', {
          class: 'cx-ui-spin__indicator',
          role: 'status',
          'aria-label': resolvedProps.value.description ?? 'loading',
        }),
      ];
      if (resolvedProps.value.description !== undefined) {
        children.push(
          h('div', { class: 'cx-ui-spin__description' }, resolvedProps.value.description),
        );
      }
      return h('div', { class: classList }, children);
    };
  },
});
