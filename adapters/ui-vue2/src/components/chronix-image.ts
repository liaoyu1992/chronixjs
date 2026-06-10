import {
  defaultImageProps,
  ensureChronixImageStyles,
  resolveImageClassList,
  resolveImageEffectiveSrc,
  resolveImageInlineStyle,
  type ImageObjectFit,
} from '@chronixjs/ui';
import { defineComponent, h, ref, type PropType } from 'vue';

import { ChronixModal } from './chronix-modal.js';

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
  setup(props, { emit, attrs }) {
    ensureChronixImageStyles();
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
      const imgAttrs: Record<string, unknown> = {
        ...attrs,
        src: effectiveSrc,
        alt: props.alt ?? '',
      };
      if (props.lazy) imgAttrs['loading'] = 'lazy';
      const imgNode = h('img', {
        class: resolveImageClassList({
          previewable: props.previewable,
          loadFailed: loadFailed.value,
        }),
        attrs: imgAttrs,
        style,
        on: { load: onImgLoad, error: onImgError, click: onImgClick },
      });
      if (!props.previewable) return imgNode;
      const previewNode = h(
        ChronixModal,
        {
          props: { show: previewOpen.value, width: 'auto' },
          on: { 'update:show': onPreviewUpdate },
        },
        [
          h('div', { class: 'cx-ui-image-preview' }, [
            h('img', {
              class: 'cx-ui-image-preview__img',
              attrs: { src: effectiveSrc, alt: props.alt ?? '' },
            }),
          ]),
        ],
      );
      return h('span', { class: 'cx-ui-image-wrapper' }, [imgNode, previewNode]);
    };
  },
});
