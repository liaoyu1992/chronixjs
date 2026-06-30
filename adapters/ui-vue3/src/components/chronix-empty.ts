import {
  defaultEmptyProps,
  ensureChronixEmptyStyles,
  resolveEmptyClassList,
  type EmptySize,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';

/**
 * `<ChronixEmpty>` — Vue 3 SFC wrapping the core `EmptyProps` IR.
 *
 * .
 *
 * Props:
 *
 * - `size` — `'small' | 'medium' | 'large'`. Drives icon + spacing.
 * - `description` — text below the icon (default `'No data'`).
 *
 * Slots:
 *
 * - `default` — optional action row (typically buttons) below the
 *   description. When present, `--with-extra` modifier is applied.
 * - `icon` — optional custom icon content; defaults to a Unicode
 *   📦 placeholder until the icon registry lands.
 */
export const ChronixEmpty = defineComponent({
  name: 'ChronixEmpty',
  props: {
    size: {
      type: String as PropType<EmptySize>,
      default: defaultEmptyProps.size,
    },
    description: {
      type: String as PropType<string | undefined>,
      default: defaultEmptyProps.description,
    },
  },
  setup(props, { slots }) {
    ensureChronixEmptyStyles();

    const resolvedProps = computed(() => ({
      size: props.size,
      description: props.description,
    }));

    return () => {
      const iconSlot = slots['icon'];
      const defaultSlot = slots['default'];
      const extraNodes = defaultSlot ? defaultSlot() : [];
      const hasExtra = extraNodes.length > 0;

      const classList = resolveEmptyClassList(resolvedProps.value, hasExtra);

      const iconChildren = iconSlot ? iconSlot() : ['📦'];
      const children: VNode[] = [h('div', { class: 'cx-ui-empty__icon' }, iconChildren)];
      if (resolvedProps.value.description !== undefined) {
        children.push(
          h('div', { class: 'cx-ui-empty__description' }, resolvedProps.value.description),
        );
      }
      if (hasExtra) {
        children.push(h('div', { class: 'cx-ui-empty__extra' }, extraNodes));
      }
      return h('div', { class: classList }, children);
    };
  },
});
