import {
  defaultWatermarkProps,
  encodeWatermarkSvgDataUrl,
  ensureChronixWatermarkStyles,
  resolveWatermarkClassList,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type VNode } from 'vue';

/**
 * `<ChronixWatermark>` — Vue 3 SFC wrapping the core
 * `WatermarkProps` IR. Phase 22 (2026-06-03). Tier A repeating
 * overlay watermark.
 *
 * The root `<div>` carries the SVG `data:` URL as inline
 * `style.backgroundImage` + `style.backgroundSize`; the default
 * slot is wrapped in a `__content` child to give it its own
 * positioned stacking context.
 *
 * No emits — Watermark is pure-visual.
 */
export const ChronixWatermark = defineComponent({
  name: 'ChronixWatermark',
  props: {
    content: {
      type: String,
      default: defaultWatermarkProps.content,
    },
    width: {
      type: Number,
      default: defaultWatermarkProps.width,
    },
    height: {
      type: Number,
      default: defaultWatermarkProps.height,
    },
    rotate: {
      type: Number,
      default: defaultWatermarkProps.rotate,
    },
    fontSize: {
      type: Number,
      default: defaultWatermarkProps.fontSize,
    },
    color: {
      type: String,
      default: defaultWatermarkProps.color,
    },
    opacity: {
      type: Number,
      default: defaultWatermarkProps.opacity,
    },
  },
  setup(props, { slots }) {
    ensureChronixWatermarkStyles();

    const resolvedProps = computed(() => ({
      content: props.content,
      width: props.width,
      height: props.height,
      rotate: props.rotate,
      fontSize: props.fontSize,
      color: props.color,
      opacity: props.opacity,
    }));

    return () => {
      const classList = resolveWatermarkClassList(resolvedProps.value);
      const dataUrl = encodeWatermarkSvgDataUrl(resolvedProps.value);
      // No inner quotes around the data URL — encodeURIComponent
      // has already escaped all spaces / parens / special chars,
      // so the CSS parser accepts the bare URL inside url(...).
      // jsdom drops the property when inner quotes break the
      // outer style="..." attribute serialization.
      const style: Record<string, string> = {
        backgroundImage: `url(${dataUrl})`,
        backgroundSize: `${resolvedProps.value.width}px ${resolvedProps.value.height}px`,
      };
      const defaultSlot = slots['default'];
      const defaultNodes: VNode[] = defaultSlot ? defaultSlot() : [];
      return h('div', { class: classList, style }, [
        h('div', { class: 'cx-ui-watermark__content' }, defaultNodes),
      ]);
    };
  },
});
