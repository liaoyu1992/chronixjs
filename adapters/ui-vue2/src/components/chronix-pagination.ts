import {
  defaultPaginationProps,
  ensureChronixPaginationStyles,
  computePaginationPages,
  resolvePaginationRootClassList,
  resolvePaginationItemClassList,
  resolvePaginationButtonClassList,
} from '@chronixjs/ui';
import { computed, defineComponent, h, ref } from 'vue';

/**
 * `<ChronixPagination>` — Vue 2 pagination with page buttons + prev/next.
 * .
 */
export const ChronixPagination = defineComponent({
  name: 'ChronixPagination',
  inheritAttrs: false,
  props: {
    page: { type: Number, default: defaultPaginationProps.page },
    pageCount: { type: Number, default: defaultPaginationProps.pageCount },
    disabled: { type: Boolean, default: defaultPaginationProps.disabled },
    pageSlot: { type: Number, default: defaultPaginationProps.pageSlot },
    showQuickJumper: { type: Boolean, default: defaultPaginationProps.showQuickJumper },
  },
  emits: {
    'update:page': (_page: number) => true,
  },
  setup(props, { emit, attrs }) {
    ensureChronixPaginationStyles();
    const jumperInput = ref('');

    const rootClass = computed(() =>
      resolvePaginationRootClassList({ disabled: props.disabled }).join(' '),
    );

    const pages = computed(() =>
      computePaginationPages(props.page, props.pageCount, props.pageSlot),
    );

    function goToPage(p: number): void {
      if (p < 1 || p > props.pageCount || props.disabled) return;
      emit('update:page', p);
    }

    function handleJumper(): void {
      const p = parseInt(jumperInput.value, 10);
      if (!isNaN(p)) goToPage(p);
      jumperInput.value = '';
    }

    return () => {
      const children: ReturnType<typeof h>[] = [
        // Prev button
        h(
          'button',
          {
            class: resolvePaginationButtonClassList({
              disabled: props.page <= 1 || props.disabled,
            }).join(' '),
            attrs: { 'data-testid': 'pagination-prev' },
            on: { click: () => goToPage(props.page - 1) },
          },
          '‹',
        ),
      ];

      // Page items
      pages.value.forEach((p, i) => {
        if (p === null) {
          children.push(
            h('span', { key: `ellipsis-${i}`, class: 'cx-ui-pagination__ellipsis' }, '…'),
          );
        } else {
          children.push(
            h(
              'button',
              {
                key: p,
                class: resolvePaginationItemClassList({
                  active: p === props.page,
                  disabled: props.disabled,
                }).join(' '),
                attrs: { 'data-testid': `pagination-page-${p}` },
                on: { click: () => goToPage(p) },
              },
              String(p),
            ),
          );
        }
      });

      // Next button
      children.push(
        h(
          'button',
          {
            class: resolvePaginationButtonClassList({
              disabled: props.page >= props.pageCount || props.disabled,
            }).join(' '),
            attrs: { 'data-testid': 'pagination-next' },
            on: { click: () => goToPage(props.page + 1) },
          },
          '›',
        ),
      );

      // Quick jumper
      if (props.showQuickJumper) {
        children.push(
          h('div', { class: 'cx-ui-pagination__jumper' }, [
            h('span', {}, 'Go to'),
            h('input', {
              class: 'cx-ui-pagination__jumper-input',
              domProps: { value: jumperInput.value },
              attrs: { 'data-testid': 'pagination-jumper' },
              on: {
                input: (e: Event) => {
                  jumperInput.value = (e.target as HTMLInputElement).value;
                },
                keydown: (e: KeyboardEvent) => {
                  if (e.key === 'Enter') handleJumper();
                },
              },
            }),
          ]),
        );
      }

      return h(
        'div',
        {
          class: rootClass.value,
          attrs: {
            ...((attrs as Record<string, unknown>)['data-testid'] != null
              ? { 'data-testid': (attrs as Record<string, unknown>)['data-testid'] as string }
              : { 'data-testid': 'pagination-root' }),
          },
        },
        children,
      );
    };
  },
});
