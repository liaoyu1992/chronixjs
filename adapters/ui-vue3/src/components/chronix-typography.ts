import {
  defaultTypographyProps,
  ensureChronixTypographyStyles,
  getTypographyTag,
  resolveTypographyClassList,
  type TypographyLevel,
  type TypographyVariant,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';

export const ChronixTypography = defineComponent({
  name: 'ChronixTypography',
  props: {
    variant: {
      type: String as PropType<TypographyVariant>,
      default: defaultTypographyProps.variant,
    },
    level: {
      type: Number as PropType<TypographyLevel>,
      default: defaultTypographyProps.level,
    },
    italic: { type: Boolean, default: defaultTypographyProps.italic },
    underline: { type: Boolean, default: defaultTypographyProps.underline },
  },
  setup(props, { slots }) {
    ensureChronixTypographyStyles();
    const resolvedProps = computed(() => ({
      variant: props.variant,
      level: props.level,
      italic: props.italic,
      underline: props.underline,
    }));
    return () => {
      const classList = resolveTypographyClassList(resolvedProps.value);
      const tag = getTypographyTag(resolvedProps.value);
      if (resolvedProps.value.variant === 'hr') {
        return h(tag, { class: classList });
      }
      const defaultSlot = slots['default'];
      const children: VNode[] = defaultSlot ? defaultSlot() : [];
      return h(tag, { class: classList }, children);
    };
  },
});
