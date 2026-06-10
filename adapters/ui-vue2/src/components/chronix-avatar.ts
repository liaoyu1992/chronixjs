import {
  defaultAvatarProps,
  ensureChronixAvatarStyles,
  resolveAvatarClassList,
  resolveAvatarContent,
  type AvatarShape,
} from '@chronixjs/ui';
import { computed, defineComponent, h, ref, type PropType, type VNode } from 'vue';

export const ChronixAvatar = defineComponent({
  name: 'ChronixAvatar',
  props: {
    src: { type: String as PropType<string | undefined>, default: defaultAvatarProps.src },
    text: { type: String as PropType<string | undefined>, default: defaultAvatarProps.text },
    size: { type: Number, default: defaultAvatarProps.size },
    shape: {
      type: String as PropType<AvatarShape>,
      default: defaultAvatarProps.shape,
    },
  },
  setup(props, { slots }) {
    ensureChronixAvatarStyles();
    const imageFailed = ref(false);
    const resolvedProps = computed(() => ({
      src: props.src,
      text: props.text,
      size: props.size,
      shape: props.shape,
    }));
    return () => {
      const classList = resolveAvatarClassList(resolvedProps.value);
      const defaultSlot = slots['default'];
      const fallbackNodes: VNode[] = defaultSlot ? defaultSlot() : [];
      const mode = resolveAvatarContent({
        props: resolvedProps.value,
        imageFailed: imageFailed.value,
        hasFallback: fallbackNodes.length > 0,
      });
      const style = {
        width: `${resolvedProps.value.size}px`,
        height: `${resolvedProps.value.size}px`,
        'font-size': `${Math.round(resolvedProps.value.size * 0.4)}px`,
      };
      if (mode === 'image' && resolvedProps.value.src !== undefined) {
        return h('span', { class: classList, style }, [
          h('img', {
            class: 'cx-ui-avatar__image',
            attrs: { src: resolvedProps.value.src, alt: resolvedProps.value.text ?? '' },
            on: {
              error: () => {
                imageFailed.value = true;
              },
            },
          }),
        ]);
      }
      if (mode === 'text') {
        return h('span', { class: classList, style }, resolvedProps.value.text ?? '');
      }
      return h('span', { class: classList, style }, fallbackNodes);
    };
  },
});
