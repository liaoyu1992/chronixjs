import {
  defaultQrCodeProps,
  encodeQrCodeMatrix,
  ensureChronixQrCodeStyles,
  resolveQrCodeClassList,
  type QrCodeErrorCorrectionLevel,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';

/**
 * `<ChronixQrCode>` — Vue 2.7 port of the QrCode.
 *
 * Renders an `<svg>` when an encoder is registered + value
 * encodes; otherwise the `--unavailable` placeholder. Vue 2's
 * `h()` data object uses `attrs:` for SVG presentational
 * attributes (width / height / viewBox / xmlns / fill / x / y /
 * shape-rendering) so the runtime serializes them as attributes
 * on the element rather than as DOM properties.
 */
export const ChronixQrCode = defineComponent({
  name: 'ChronixQrCode',
  props: {
    value: {
      type: String,
      default: defaultQrCodeProps.value,
    },
    size: {
      type: Number,
      default: defaultQrCodeProps.size,
    },
    errorCorrectionLevel: {
      type: String as PropType<QrCodeErrorCorrectionLevel>,
      default: defaultQrCodeProps.errorCorrectionLevel,
    },
    foreground: {
      type: String,
      default: defaultQrCodeProps.foreground,
    },
    background: {
      type: String,
      default: defaultQrCodeProps.background,
    },
  },
  setup(props) {
    ensureChronixQrCodeStyles();

    const resolvedProps = computed(() => ({
      value: props.value,
      size: props.size,
      errorCorrectionLevel: props.errorCorrectionLevel,
      foreground: props.foreground,
      background: props.background,
    }));

    return () => {
      const matrix = encodeQrCodeMatrix(
        resolvedProps.value.value,
        resolvedProps.value.errorCorrectionLevel,
      );
      const isUnavailable = matrix === undefined;
      const classList = resolveQrCodeClassList(resolvedProps.value, isUnavailable);

      if (isUnavailable) {
        return h(
          'div',
          {
            class: classList,
            style: {
              width: `${resolvedProps.value.size}px`,
              height: `${resolvedProps.value.size}px`,
            },
          },
          [h('div', { class: 'cx-ui-qrcode__unavailable-message' }, 'QR encoder unavailable')],
        );
      }

      const moduleCount = matrix.length;
      const rects: VNode[] = [];
      for (let r = 0; r < moduleCount; r += 1) {
        for (let c = 0; c < moduleCount; c += 1) {
          if (matrix[r]![c]) {
            rects.push(
              h('rect', {
                key: `${r}-${c}`,
                attrs: {
                  x: String(c),
                  y: String(r),
                  width: '1',
                  height: '1',
                  fill: resolvedProps.value.foreground,
                },
              }),
            );
          }
        }
      }

      return h('div', { class: classList }, [
        h(
          'svg',
          {
            class: 'cx-ui-qrcode__svg',
            attrs: {
              width: String(resolvedProps.value.size),
              height: String(resolvedProps.value.size),
              viewBox: `0 0 ${moduleCount} ${moduleCount}`,
              xmlns: 'http://www.w3.org/2000/svg',
              'shape-rendering': 'crispEdges',
            },
          },
          [
            h('rect', {
              attrs: {
                x: '0',
                y: '0',
                width: String(moduleCount),
                height: String(moduleCount),
                fill: resolvedProps.value.background,
              },
            }),
            ...rects,
          ],
        ),
      ]);
    };
  },
});
