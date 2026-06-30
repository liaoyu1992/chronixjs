import {
  defaultSkeletonProps,
  ensureChronixSkeletonStyles,
  formatSkeletonSize,
  resolveSkeletonClassList,
  type SkeletonProps,
  type SkeletonShape,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType } from 'vue';

/**
 * `<ChronixSkeleton>` — Vue 2.7 port of the Skeleton.
 * Verbatim surface mirror of vue3 sibling.
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
      const style: Record<string, string> = {};
      const w = formatSkeletonSize(resolvedProps.value.width);
      const h2 = formatSkeletonSize(resolvedProps.value.height);
      if (w !== undefined) style['width'] = w;
      if (h2 !== undefined) style['height'] = h2;
      return h('div', { class: classList, style });
    };
  },
});
