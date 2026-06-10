import {
  defaultCascaderProps,
  ensureChronixCascaderStyles,
  isOptionGroup,
  normalizeSelectValue,
  resolveCascaderArrowClassList,
  resolveCascaderDropdownClassList,
  resolveCascaderOptionClassList,
  resolveCascaderPanelClassList,
  resolveCascaderPathLabels,
  resolveCascaderRootClassList,
  resolveCascaderTagClassList,
  resolveCascaderTagCloseClassList,
  resolveCascaderTriggerClassList,
  type PopupPlacement,
  type SelectOption,
  type OptionSpec,
} from '@chronixjs/ui';
import { computed, defineComponent, h, ref, toRef, type PropType, type VNode } from 'vue';

import { usePopupLifecycle } from '../composables/use-popup-lifecycle.js';

export const ChronixCascader = defineComponent({
  name: 'ChronixCascader',
  inheritAttrs: false,
  props: {
    value: {
      type: [String, Array] as PropType<string | readonly string[] | undefined>,
      default: defaultCascaderProps.value,
    },
    options: {
      type: Array as PropType<readonly SelectOption[]>,
      default: () => defaultCascaderProps.options,
    },
    multiple: { type: Boolean, default: defaultCascaderProps.multiple },
    clearable: { type: Boolean, default: defaultCascaderProps.clearable },
    placeholder: { type: String, default: defaultCascaderProps.placeholder },
    disabled: { type: Boolean, default: defaultCascaderProps.disabled },
    placement: {
      type: String as PropType<PopupPlacement>,
      default: defaultCascaderProps.placement,
    },
    show: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  },
  emits: {
    'update:show': (_show: boolean) => true,
    'update:value': (_value: string | string[]) => true,
  },
  setup(props, { emit, attrs }) {
    ensureChronixCascaderStyles();
    const activePath = ref<string[]>([]);

    const lifecycle = usePopupLifecycle({
      show: toRef(props, 'show'),
      trigger: ref('click'),
      placement: toRef(props, 'placement'),
      offset: ref(4),
      flip: ref(true),
      widthMatch: ref(false),
      disabled: toRef(props, 'disabled'),
      onVisibilityChange: (next) => {
        emit('update:show', next);
        if (!next) activePath.value = [];
      },
    });

    const normalizedValue = computed(() => normalizeSelectValue(props.value, props.multiple));
    const displayLabel = computed(() => {
      if (normalizedValue.value.length === 0) return '';
      if (props.multiple)
        return normalizedValue.value
          .map((v) => resolveCascaderPathLabels(props.options, v).join(' / '))
          .join(', ');
      return resolveCascaderPathLabels(props.options, normalizedValue.value[0]!).join(' / ');
    });
    const rootClass = computed(() =>
      resolveCascaderRootClassList({
        multiple: props.multiple,
        disabled: props.disabled,
        open: lifecycle.visible.value,
      }).join(' '),
    );
    const triggerClass = computed(() =>
      resolveCascaderTriggerClassList(
        normalizedValue.value.length > 0,
        lifecycle.visible.value,
        normalizedValue.value.length === 0,
      ).join(' '),
    );
    const arrowClass = computed(() =>
      resolveCascaderArrowClassList(lifecycle.visible.value).join(' '),
    );

    const panels = computed(() => {
      const result: { options: readonly SelectOption[]; level: number }[] = [
        { options: props.options, level: 0 },
      ];
      for (let i = 0; i < activePath.value.length; i++) {
        const activeKey = activePath.value[i]!;
        const currentOptions = result[i]!.options;
        const activeOpt = currentOptions.find((o) => o.key === activeKey);
        if (activeOpt && isOptionGroup(activeOpt) && activeOpt.children.length > 0) {
          result.push({ options: activeOpt.children, level: i + 1 });
        } else break;
      }
      return result;
    });

    function isLeaf(opt: SelectOption): boolean {
      return !isOptionGroup(opt) || !opt.children || opt.children.length === 0;
    }
    function onOptionClick(opt: SelectOption, level: number): void {
      activePath.value = [...activePath.value.slice(0, level), opt.key];
      if (isLeaf(opt)) {
        const leaf = opt as OptionSpec;
        if (leaf.disabled) return;
        if (props.multiple) {
          const current = [...normalizedValue.value];
          const idx = current.indexOf(leaf.value);
          if (idx >= 0) current.splice(idx, 1);
          else current.push(leaf.value);
          emit('update:value', current);
        } else {
          emit('update:value', leaf.value);
          emit('update:show', false);
        }
      }
    }
    function removeTag(val: string): void {
      if (!props.multiple) return;
      emit(
        'update:value',
        normalizedValue.value.filter((v) => v !== val),
      );
    }

    return () => {
      const triggerChildren: (VNode | string)[] = [];
      if (props.multiple && normalizedValue.value.length > 0) {
        for (const val of normalizedValue.value) {
          const label = resolveCascaderPathLabels(props.options, val).join(' / ');
          triggerChildren.push(
            h('span', { class: resolveCascaderTagClassList().join(' '), key: `tag-${val}` }, [
              h('span', undefined, label),
              h(
                'span',
                {
                  class: resolveCascaderTagCloseClassList().join(' '),
                  on: {
                    mousedown: (e: MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeTag(val);
                    },
                  },
                },
                '×',
              ),
            ]),
          );
        }
      } else if (displayLabel.value) {
        triggerChildren.push(
          h('span', { class: 'cx-ui-cascader__value-text' }, displayLabel.value),
        );
      } else {
        triggerChildren.push(h('span', { class: 'cx-ui-cascader__value-text' }, props.placeholder));
      }
      triggerChildren.push(h('span', { class: arrowClass.value }, '▾'));

      const panelNodes = panels.value.map((panel) => {
        const optionNodes = panel.options.map((opt) => {
          const isActive = activePath.value[panel.level] === opt.key;
          const leafVal = !isLeaf(opt) ? undefined : (opt as OptionSpec).value;
          const isSelected = leafVal !== undefined && normalizedValue.value.includes(leafVal);
          const isDisabled = !!(opt as { disabled?: boolean }).disabled;
          const classes = resolveCascaderOptionClassList(isSelected, isActive, isDisabled).join(
            ' ',
          );
          const children: (string | VNode)[] = [opt.label];
          if (!isLeaf(opt))
            children.push(h('span', { class: 'cx-ui-cascader__option-arrow' }, '›'));
          return h(
            'div',
            {
              key: opt.key,
              class: classes,
              attrs: { 'data-testid': `cascader-option-${opt.key}` },
              on: {
                mouseenter: () => {
                  activePath.value = [...activePath.value.slice(0, panel.level), opt.key];
                },
                click: () => onOptionClick(opt, panel.level),
              },
            },
            children,
          );
        });
        return h(
          'div',
          { class: resolveCascaderPanelClassList().join(' '), key: `panel-${panel.level}` },
          optionNodes,
        );
      });

      // Vue 2: inline popup
      const children: (VNode | null)[] = [
        h(
          'div',
          {
            class: triggerClass.value,
            on: {
              click: () => {
                if (!props.disabled) emit('update:show', !lifecycle.visible.value);
              },
            },
          },
          triggerChildren,
        ),
      ];
      if (lifecycle.visible.value) {
        children.push(
          h(
            'div',
            {
              ref: lifecycle.popupRef,
              class: resolveCascaderDropdownClassList().join(' '),
              style: lifecycle.popupStyle.value,
              on: lifecycle.popupHandlers,
              attrs: { 'data-testid': 'cascader-dropdown-popup' },
            },
            panelNodes,
          ),
        );
      }

      return h(
        'div',
        {
          ref: lifecycle.triggerRef,
          class: rootClass.value,
          attrs: {
            'data-testid':
              ((attrs as Record<string, unknown>)['data-testid'] as string) ?? 'cascader-root',
          },
          on: lifecycle.triggerHandlers,
        },
        children,
      );
    };
  },
});
