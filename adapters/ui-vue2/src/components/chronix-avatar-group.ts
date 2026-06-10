import {
  defaultAvatarGroupProps,
  ensureChronixAvatarGroupStyles,
  resolveAvatarGroupClassList,
  splitAvatarGroupItems,
  type AvatarItem,
  type AvatarShape,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';

import { ChronixAvatar } from './chronix-avatar.js';

export const ChronixAvatarGroup = defineComponent({
  name: 'ChronixAvatarGroup',
  props: {
    items: {
      type: Array as PropType<readonly AvatarItem[]>,
      default: (): readonly AvatarItem[] => defaultAvatarGroupProps.items,
    },
    max: { type: Number, default: defaultAvatarGroupProps.max },
    size: { type: Number, default: defaultAvatarGroupProps.size },
    shape: {
      type: String as PropType<AvatarShape>,
      default: defaultAvatarGroupProps.shape,
    },
  },
  setup(props) {
    ensureChronixAvatarGroupStyles();
    const resolvedProps = computed(() => ({
      items: props.items,
      max: props.max,
      size: props.size,
      shape: props.shape,
    }));
    return () => {
      const classList = resolveAvatarGroupClassList(resolvedProps.value);
      const split = splitAvatarGroupItems(resolvedProps.value.items, resolvedProps.value.max);
      const children: VNode[] = split.visible.map((item) =>
        h(ChronixAvatar, {
          key: item.key,
          props: {
            src: item.src,
            text: item.text,
            size: resolvedProps.value.size,
            shape: resolvedProps.value.shape,
          },
        }),
      );
      if (split.hiddenCount > 0) {
        children.push(
          h(
            'span',
            {
              key: '__overflow',
              class: [
                'cx-ui-avatar',
                `cx-ui-avatar--${resolvedProps.value.shape}`,
                'cx-ui-avatar-group__overflow',
              ],
              style: {
                width: `${resolvedProps.value.size}px`,
                height: `${resolvedProps.value.size}px`,
                'font-size': `${Math.round(resolvedProps.value.size * 0.4)}px`,
              },
            },
            `+${split.hiddenCount}`,
          ),
        );
      }
      return h('div', { class: classList }, children);
    };
  },
});
