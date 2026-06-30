import {
  defaultTreeSelectProps,
  ensureChronixTreeSelectStyles,
  normalizeSelectValue,
  resolveTreeSelectArrowClassList,
  resolveTreeSelectDropdownClassList,
  resolveTreeSelectEmptyClassList,
  resolveTreeSelectRootClassList,
  resolveTreeSelectRowClassList,
  resolveTreeSelectTagClassList,
  resolveTreeSelectTagCloseClassList,
  resolveTreeSelectTriggerClassList,
  resolveTreeSelectTreeClassList,
  resolveVisibleTreeRows,
  type PopupPlacement,
  type TreeNodeData,
  type TreeNodeSpec,
} from '@chronixjs/ui';
import {
  Teleport,
  computed,
  defineComponent,
  h,
  ref,
  toRef,
  useAttrs,
  type PropType,
  type VNode,
} from 'vue';

import { usePopupLifecycle } from '../composables/use-popup-lifecycle.js';

/**
 * `<ChronixTreeSelect>` — Vue 3 tree select. .
 * Select trigger + dropdown with Tree rows.
 */
export const ChronixTreeSelect = defineComponent({
  name: 'ChronixTreeSelect',
  inheritAttrs: false,
  props: {
    value: {
      type: [String, Array] as PropType<string | readonly string[] | undefined>,
      default: defaultTreeSelectProps.value,
    },
    data: {
      type: Array as PropType<readonly TreeNodeSpec<TreeNodeData>[]>,
      default: () => defaultTreeSelectProps.data,
    },
    multiple: { type: Boolean, default: defaultTreeSelectProps.multiple },
    clearable: { type: Boolean, default: defaultTreeSelectProps.clearable },
    placeholder: { type: String, default: defaultTreeSelectProps.placeholder },
    disabled: { type: Boolean, default: defaultTreeSelectProps.disabled },
    expandedKeys: {
      type: Array as PropType<readonly string[]>,
      default: () => defaultTreeSelectProps.expandedKeys,
    },
    filterTree: { type: Boolean, default: defaultTreeSelectProps.filterTree },
    placement: {
      type: String as PropType<PopupPlacement>,
      default: defaultTreeSelectProps.placement,
    },
    show: {
      type: Boolean as PropType<boolean | undefined>,
      default: undefined,
    },
  },
  emits: {
    'update:show': (_show: boolean) => true,
    'update:value': (_value: string | string[]) => true,
    'update:expandedKeys': (_keys: string[]) => true,
  },
  setup(props, { emit }) {
    const attrs = useAttrs();
    ensureChronixTreeSelectStyles();

    const focusedKey = ref<string | null>(null);

    const lifecycle = usePopupLifecycle({
      show: toRef(props, 'show'),
      trigger: ref('click'),
      placement: toRef(props, 'placement'),
      offset: ref(4),
      flip: ref(true),
      widthMatch: ref(true),
      disabled: toRef(props, 'disabled'),
      onVisibilityChange: (next) => {
        emit('update:show', next);
        if (!next) focusedKey.value = null;
      },
    });

    const normalizedValue = computed(() => normalizeSelectValue(props.value, props.multiple));

    const expandedKeySet = computed(() => new Set(props.expandedKeys));

    const visibleRows = computed(() =>
      resolveVisibleTreeRows({
        items: props.data,
        expandedKeys: expandedKeySet.value,
      }),
    );

    const selectedLabels = computed(() => {
      const labels: string[] = [];
      for (const val of normalizedValue.value) {
        for (const row of visibleRows.value) {
          if (String(row.node.key) === val) {
            labels.push(row.node.data?.label ?? String(row.node.key));
            break;
          }
        }
      }
      return labels;
    });

    const rootClass = computed(() =>
      resolveTreeSelectRootClassList({
        multiple: props.multiple,
        disabled: props.disabled,
        open: lifecycle.visible.value,
      }).join(' '),
    );

    const triggerClass = computed(() =>
      resolveTreeSelectTriggerClassList(
        normalizedValue.value.length > 0,
        lifecycle.visible.value,
        normalizedValue.value.length === 0,
      ).join(' '),
    );

    const arrowClass = computed(() =>
      resolveTreeSelectArrowClassList(lifecycle.visible.value).join(' '),
    );

    function selectNode(key: string): void {
      if (props.multiple) {
        const current = [...normalizedValue.value];
        const idx = current.indexOf(key);
        if (idx >= 0) {
          current.splice(idx, 1);
        } else {
          current.push(key);
        }
        emit('update:value', current);
      } else {
        emit('update:value', key);
        emit('update:show', false);
      }
    }

    function toggleExpand(key: string): void {
      const set = new Set(props.expandedKeys);
      if (set.has(key)) {
        set.delete(key);
      } else {
        set.add(key);
      }
      emit('update:expandedKeys', [...set]);
    }

    function removeTag(value: string): void {
      if (!props.multiple) return;
      const current = normalizedValue.value.filter((v) => v !== value);
      emit('update:value', current);
    }

    return () => {
      // ── trigger content ──
      const triggerChildren: (VNode | string)[] = [];

      if (props.multiple && normalizedValue.value.length > 0) {
        for (let i = 0; i < normalizedValue.value.length; i++) {
          const val = normalizedValue.value[i]!;
          const label = selectedLabels.value[i] ?? val;
          triggerChildren.push(
            h('span', { class: resolveTreeSelectTagClassList().join(' '), key: `tag-${val}` }, [
              h('span', null, label),
              h(
                'span',
                {
                  class: resolveTreeSelectTagCloseClassList().join(' '),
                  onMousedown: (e: MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeTag(val);
                  },
                },
                '×',
              ),
            ]),
          );
        }
      } else if (normalizedValue.value.length === 1 && !props.multiple) {
        triggerChildren.push(
          h(
            'span',
            { class: 'cx-ui-tree-select__value-text' },
            selectedLabels.value[0] ?? normalizedValue.value[0],
          ),
        );
      } else {
        triggerChildren.push(
          h('span', { class: 'cx-ui-tree-select__value-text' }, props.placeholder),
        );
      }

      triggerChildren.push(h('span', { class: arrowClass.value }, '▾'));

      // ── dropdown tree rows ──
      const treeContent: VNode[] = [];

      if (visibleRows.value.length === 0) {
        treeContent.push(
          h('div', { class: resolveTreeSelectEmptyClassList().join(' ') }, 'No data'),
        );
      } else {
        for (const row of visibleRows.value) {
          const key = String(row.node.key);
          const isSelected = normalizedValue.value.includes(key);
          const isFocused = focusedKey.value === key;
          const isDisabled = !!row.node.data?.disabled;
          const hasChildren = !!(row.node as { children?: unknown }).children;

          const rowClasses = resolveTreeSelectRowClassList(isSelected, isFocused, isDisabled).join(
            ' ',
          );

          const indentStyle = `padding-left: ${row.depth * 20}px`;

          const arrowInner = hasChildren
            ? h(
                'span',
                {
                  class: [
                    'cx-ui-tree-select__tree-arrow',
                    expandedKeySet.value.has(key) ? 'cx-ui-tree-select__tree-arrow--expanded' : '',
                  ].join(' '),
                  onClick: (e: MouseEvent) => {
                    e.stopPropagation();
                    toggleExpand(key);
                  },
                },
                '▶',
              )
            : h(
                'span',
                { class: 'cx-ui-tree-select__tree-arrow cx-ui-tree-select__tree-arrow--hidden' },
                '▶',
              );

          treeContent.push(
            h(
              'div',
              {
                key,
                class: rowClasses,
                style: indentStyle,
                'data-testid': `tree-select-row-${key}`,
                onClick: () => {
                  if (!isDisabled) {
                    if (hasChildren) toggleExpand(key);
                    selectNode(key);
                  }
                },
                onMouseenter: () => {
                  focusedKey.value = key;
                },
              },
              [
                arrowInner,
                h(
                  'span',
                  { class: 'cx-ui-tree-select__tree-row-content' },
                  row.node.data?.label ?? String(row.node.key),
                ),
              ],
            ),
          );
        }
      }

      const children: (VNode | null)[] = [
        h(
          'div',
          {
            class: triggerClass.value,
            onClick: () => {
              if (!props.disabled) {
                emit('update:show', !lifecycle.visible.value);
              }
            },
          },
          triggerChildren,
        ),
      ];

      children.push(
        h(Teleport, { to: lifecycle.portalTarget.value }, [
          lifecycle.visible.value
            ? h(
                'div',
                {
                  ref: lifecycle.popupRef,
                  class: resolveTreeSelectDropdownClassList().join(' '),
                  style: lifecycle.popupStyle.value,
                  ...lifecycle.popupHandlers,
                  'data-testid': 'tree-select-dropdown-popup',
                },
                [h('div', { class: resolveTreeSelectTreeClassList().join(' ') }, treeContent)],
              )
            : null,
        ]),
      );

      return h(
        'div',
        {
          ref: lifecycle.triggerRef,
          class: rootClass.value,
          'data-testid':
            ((attrs as Record<string, unknown>)['data-testid'] as string) ?? 'tree-select-root',
          ...lifecycle.triggerHandlers,
        },
        children,
      );
    };
  },
});
