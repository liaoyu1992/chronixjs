import {
  defaultWatermarkProps,
  encodeWatermarkSvgDataUrl,
  ensureChronixWatermarkStyles,
  resolveWatermarkClassList,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type VNode } from 'vue';

/**
 * `<ChronixWatermark>` — Vue 2.7 port of the Phase 22 Watermark.
 *
 * Inline style is an object on `style:`; Vue 2 accepts the same
 * camelCase object form as Vue 3. DOM shape, class list, slot
 * semantics are byte-identical to the vue3 sibling.
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
      const style: Record<string, string> = {
        'background-image': `url(${dataUrl})`,
        'background-size': `${resolvedProps.value.width}px ${resolvedProps.value.height}px`,
      };
      const defaultSlot = slots['default'];
      const defaultNodes: VNode[] = defaultSlot ? defaultSlot() : [];
      return h('div', { class: classList, style }, [
        h('div', { class: 'cx-ui-watermark__content' }, defaultNodes),
      ]);
    };
  },
});
