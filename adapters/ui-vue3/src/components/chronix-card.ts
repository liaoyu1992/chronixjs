import {
  defaultCardProps,
  ensureChronixCardStyles,
  resolveCardClassList,
  type CardProps,
  type CardSize,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';

/**
 * `<ChronixCard>` — Vue 3 SFC wrapping the core `CardProps` IR.
 *
 * Phase 15 (2026-06-02).
 *
 * Props:
 *
 * - `size` — `'small' | 'medium' | 'large'`. Drives padding tokens.
 * - `title` — optional title text. Renders `__header` row when set.
 * - `bordered` — visible 1px border. Default true.
 * - `hoverable` — hover-shadow effect.
 * - `embedded` — flat blends-with-background variant.
 *
 * Slots:
 *
 * - `default` — body content rendered inside `__content`.
 * - `footer` — optional footer content. When present, `--with-footer`
 *   class is applied and `__footer` row renders.
 */
export const ChronixCard = defineComponent({
  name: 'ChronixCard',
  props: {
    size: {
      type: String as PropType<CardSize>,
      default: defaultCardProps.size,
    },
    title: {
      type: String as PropType<string | undefined>,
      default: defaultCardProps.title,
    },
    bordered: {
      type: Boolean,
      default: defaultCardProps.bordered,
    },
    hoverable: {
      type: Boolean,
      default: defaultCardProps.hoverable,
    },
    embedded: {
      type: Boolean,
      default: defaultCardProps.embedded,
    },
  },
  setup(props, { slots }) {
    ensureChronixCardStyles();

    const resolvedProps = computed<CardProps>(() => ({
      size: props.size,
      title: props.title,
      bordered: props.bordered,
      hoverable: props.hoverable,
      embedded: props.embedded,
    }));

    return () => {
      const defaultSlot = slots['default'];
      const footerSlot = slots['footer'];
      const footerNodes = footerSlot ? footerSlot() : [];
      const hasFooter = footerNodes.length > 0;

      const classList = resolveCardClassList(resolvedProps.value, hasFooter);

      const children: VNode[] = [];
      if (resolvedProps.value.title !== undefined) {
        children.push(h('div', { class: 'cx-ui-card__header' }, resolvedProps.value.title));
      }
      children.push(h('div', { class: 'cx-ui-card__content' }, defaultSlot ? defaultSlot() : []));
      if (hasFooter) {
        children.push(h('div', { class: 'cx-ui-card__footer' }, footerNodes));
      }
      return h('div', { class: classList }, children);
    };
  },
});
