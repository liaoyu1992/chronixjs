import {
  defaultProgressProps,
  ensureChronixProgressStyles,
  formatProgressPercentage,
  resolveProgressClassList,
  type ProgressIndicatorPlacement,
  type ProgressProps,
  type ProgressType,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type CSSProperties, type PropType, type VNode } from 'vue';

/**
 * `<ChronixProgress>` — Vue 3 SFC wrapping the core `ProgressProps`
 * IR. Line variant only (per Phase 16 Decision B.1).
 *
 * Props:
 *
 * - `type` — semantic color (`default` / `success` / `warning` /
 *   `error` / `info`). Default `'default'`.
 * - `percentage` — numeric, clamped to [0, 100] by
 *   `formatProgressPercentage`. Default 0.
 * - `showInfo` — toggles the percentage text. Default `true`.
 * - `height` — optional rail height in pixels. Default `undefined`
 *   (CSS token fallback).
 * - `indicatorPlacement` — `'inside' | 'outside'`. Default `'outside'`.
 *
 * No context inheritance — Progress sizing is numeric, not a discrete
 * size token (per Phase 16 Decision C.1).
 */
export const ChronixProgress = defineComponent({
  name: 'ChronixProgress',
  props: {
    type: {
      type: String as PropType<ProgressType>,
      default: defaultProgressProps.type,
    },
    percentage: {
      type: Number,
      default: defaultProgressProps.percentage,
    },
    showInfo: {
      type: Boolean,
      default: defaultProgressProps.showInfo,
    },
    height: {
      type: Number as PropType<number | undefined>,
      default: defaultProgressProps.height,
    },
    indicatorPlacement: {
      type: String as PropType<ProgressIndicatorPlacement>,
      default: defaultProgressProps.indicatorPlacement,
    },
  },
  setup(props) {
    ensureChronixProgressStyles();

    const resolvedProps = computed<ProgressProps>(() => ({
      type: props.type,
      percentage: props.percentage,
      showInfo: props.showInfo,
      height: props.height,
      indicatorPlacement: props.indicatorPlacement,
    }));

    const formatted = computed(() => formatProgressPercentage(resolvedProps.value.percentage));

    return () => {
      const classList = resolveProgressClassList(resolvedProps.value);
      const fillStyle: CSSProperties = { width: `${formatted.value.clamped}%` };
      const railStyle: CSSProperties = {};
      if (resolvedProps.value.height !== undefined) {
        railStyle.height = `${resolvedProps.value.height}px`;
      }

      const railChildren: VNode[] = [h('div', { class: 'cx-ui-progress__fill', style: fillStyle })];
      if (resolvedProps.value.showInfo && resolvedProps.value.indicatorPlacement === 'inside') {
        railChildren.push(h('div', { class: 'cx-ui-progress__info' }, formatted.value.display));
      }
      const rail = h('div', { class: 'cx-ui-progress__rail', style: railStyle }, railChildren);

      const rootChildren: VNode[] = [rail];
      if (resolvedProps.value.showInfo && resolvedProps.value.indicatorPlacement === 'outside') {
        rootChildren.push(h('div', { class: 'cx-ui-progress__info' }, formatted.value.display));
      }
      return h('div', { class: classList }, rootChildren);
    };
  },
});
