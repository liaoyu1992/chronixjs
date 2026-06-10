import {
  defaultSkeletonProps,
  ensureChronixSkeletonStyles,
  formatSkeletonSize,
  resolveSkeletonClassList,
  type SkeletonProps,
  type SkeletonShape,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type CSSProperties, type PropType } from 'vue';

/**
 * `<ChronixSkeleton>` — Vue 3 SFC wrapping the core `SkeletonProps`
 * IR. Single-element placeholder; consumers stack multiple instances
 * for multi-line layouts.
 *
 * Phase 16 (2026-06-02).
 *
 * Props:
 *
 * - `shape` — `'text' | 'rect' | 'circle'`. Default `'text'`.
 * - `width` / `height` — `string | number | undefined`. Numeric is
 *   converted to `Npx`; string passes through verbatim; `undefined`
 *   omits the inline style (CSS-default sizing applies).
 * - `animated` — `boolean`. Default `true`. `false` flattens the
 *   shimmer animation.
 * - `round` — `boolean`. Default `false`. `true` applies pill ends
 *   (`border-radius: 999px`).
 */
export const ChronixSkeleton = defineComponent({
  name: 'ChronixSkeleton',
  props: {
    shape: {
      type: String as PropType<SkeletonShape>,
      default: defaultSkeletonProps.shape,
    },
    width: {
      type: [String, Number] as PropType<string | number | undefined>,
      default: defaultSkeletonProps.width,
    },
    height: {
      type: [String, Number] as PropType<string | number | undefined>,
      default: defaultSkeletonProps.height,
    },
    animated: {
      type: Boolean,
      default: defaultSkeletonProps.animated,
    },
    round: {
      type: Boolean,
      default: defaultSkeletonProps.round,
    },
  },
  setup(props) {
    ensureChronixSkeletonStyles();

    const resolvedProps = computed<SkeletonProps>(() => ({
      shape: props.shape,
      width: props.width,
      height: props.height,
      animated: props.animated,
      round: props.round,
    }));

    return () => {
      const classList = resolveSkeletonClassList(resolvedProps.value);
      const style: CSSProperties = {};
      const w = formatSkeletonSize(resolvedProps.value.width);
      const h2 = formatSkeletonSize(resolvedProps.value.height);
      if (w !== undefined) style.width = w;
      if (h2 !== undefined) style.height = h2;
      return h('div', { class: classList, style });
    };
  },
});
