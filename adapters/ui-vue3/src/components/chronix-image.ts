import {
  defaultImageProps,
  ensureChronixImageStyles,
  resolveImageClassList,
  resolveImageEffectiveSrc,
  resolveImageInlineStyle,
  type ImageObjectFit,
} from '@chronixjs/ui';
import { defineComponent, h, ref, useAttrs, type PropType } from 'vue';

import { ChronixModal } from './chronix-modal.js';

/**
 * `<ChronixImage>` — Vue 3. . Enhanced `<img>`
 * with native lazy loading + error fallback + previewable lightbox
 * via inlined `<ChronixModal>`. `inheritAttrs: false` so consumer
 * attrs (e.g. `data-testid`) land on the `<img>` and not the wrapper.
 */
export const ChronixImage = defineComponent({
  name: 'ChronixImage',
  inheritAttrs: false,
  props: {
    src: { type: String, default: defaultImageProps.src },
    alt: {
      type: String as PropType<string | undefined>,
      default: defaultImageProps.alt,
    },
    width: {
      type: [Number, String] as PropType<number | string | undefined>,
      default: defaultImageProps.width,
    },
    height: {
      type: [Number, String] as PropType<number | string | undefined>,
      default: defaultImageProps.height,
    },
    objectFit: {
      type: String as PropType<ImageObjectFit>,
      default: defaultImageProps.objectFit,
    },
    previewable: { type: Boolean, default: defaultImageProps.previewable },
    lazy: { type: Boolean, default: defaultImageProps.lazy },
    fallback: {
      type: String as PropType<string | undefined>,
      default: defaultImageProps.fallback,
    },
  },
  emits: {
    load: (_event: Event) => true,
    error: (_event: Event) => true,
    'preview-open': () => true,
    'preview-close': () => true,
  },
  setup(props, { emit }) {
    ensureChronixImageStyles();
    const attrs = useAttrs();
    const loadFailed = ref(false);
    const previewOpen = ref(false);

    function onImgLoad(event: Event): void {
      emit('load', event);
    }

    function onImgError(event: Event): void {
      loadFailed.value = true;
      emit('error', event);
    }

    function onImgClick(): void {
      if (!props.previewable) return;
      previewOpen.value = true;
      emit('preview-open');
    }

    function onPreviewUpdate(next: boolean): void {
      previewOpen.value = next;
      if (!next) emit('preview-close');
    }

    return () => {
      const effectiveSrc = resolveImageEffectiveSrc({
        src: props.src,
        fallback: props.fallback,
        loadFailed: loadFailed.value,
      });
      const style = resolveImageInlineStyle({
        width: props.width,
        height: props.height,
        objectFit: props.objectFit,
      });
      const imgProps: Record<string, unknown> = {
        ...attrs,
        class: resolveImageClassList({
          previewable: props.previewable,
          loadFailed: loadFailed.value,
        }),
        src: effectiveSrc,
        alt: props.alt ?? '',
        style,
        onLoad: onImgLoad,
        onError: onImgError,
        onClick: onImgClick,
      };
      if (props.lazy) imgProps['loading'] = 'lazy';
      const imgNode = h('img', imgProps);
      if (!props.previewable) return imgNode;
      const previewNode = h(
        ChronixModal,
        {
          show: previewOpen.value,
          'onUpdate:show': onPreviewUpdate,
          width: 'auto',
        },
        () => [
          h('div', { class: 'cx-ui-image-preview' }, [
            h('img', {
              class: 'cx-ui-image-preview__img',
              src: effectiveSrc,
              alt: props.alt ?? '',
            }),
          ]),
        ],
      );
      return h('span', { class: 'cx-ui-image-wrapper' }, [imgNode, previewNode]);
    };
  },
});
