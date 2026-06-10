import {
  createUploadFileId,
  defaultUploadProps,
  ensureChronixUploadStyles,
  resolveUploadClassList,
  resolveUploadFileClassList,
  type UploadFileInfo,
} from '@chronixjs/ui';
import { computed, defineComponent, h, ref, type PropType, type VNode } from 'vue';

/**
 * `<ChronixUpload>` — Vue 2.7 port of the Phase 35 Upload.
 * Verbatim surface mirror of the vue3 sibling; runtime differences are
 * Vue 2's `attrs:` data-object for HTML attributes and `on:` for events.
 * Hidden file input triggered by button click.
 */
export const ChronixUpload = defineComponent({
  name: 'ChronixUpload',
  props: {
    action: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
    fileList: {
      type: Array as PropType<readonly UploadFileInfo[] | undefined>,
      default: undefined,
    },
    accept: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
    multiple: {
      type: Boolean,
      default: defaultUploadProps.multiple,
    },
    directory: {
      type: Boolean,
      default: defaultUploadProps.directory,
    },
    disabled: {
      type: Boolean,
      default: defaultUploadProps.disabled,
    },
  },
  emits: {
    'update:fileList': (_files: UploadFileInfo[]) => true,
    change: (_files: UploadFileInfo[]) => true,
  },
  setup(props, { slots, emit, attrs }) {
    ensureChronixUploadStyles();

    const inputRef = ref<HTMLInputElement | null>(null);

    const classList = computed(() => resolveUploadClassList({ disabled: props.disabled ?? false }));

    function onTriggerClick(): void {
      if (props.disabled) return;
      inputRef.value?.click();
    }

    function onFileChange(event: Event): void {
      const target = event.target as HTMLInputElement;
      const files = target.files;
      if (!files || files.length === 0) return;

      const newFiles: UploadFileInfo[] = [...(props.fileList ?? [])];
      for (const file of Array.from(files)) {
        newFiles.push({
          id: createUploadFileId(),
          name: file.name,
          status: 'pending' as const,
          file: file,
        });
      }
      emit('update:fileList', newFiles);
      emit('change', newFiles);

      // Reset input so the same file can be selected again
      target.value = '';
    }

    return () => {
      const defaultSlot = slots['default'];
      const children: VNode[] = [];

      // Hidden file input
      children.push(
        h('input', {
          ref: inputRef,
          class: 'cx-ui-upload__input',
          attrs: {
            type: 'file',
            accept: props.accept,
            multiple: props.multiple,
            ...(props.directory ? { webkitdirectory: '', directory: '' } : {}),
          },
          style: { display: 'none' },
          on: { change: onFileChange },
        }),
      );

      // Trigger button
      children.push(
        h(
          'button',
          {
            class: 'cx-ui-upload__trigger',
            attrs: {
              type: 'button',
              disabled: props.disabled || undefined,
            },
            on: { click: onTriggerClick },
          },
          defaultSlot ? defaultSlot() : ['Upload'],
        ),
      );

      // File list
      const fileList = props.fileList;
      if (fileList && fileList.length > 0) {
        const listChildren: VNode[] = fileList.map((file) => {
          const fileChildren: VNode[] = [
            h('span', { class: 'cx-ui-upload-file__name' }, file.name),
          ];
          if (file.status === 'uploading' && file.percentage !== undefined) {
            fileChildren.push(
              h('div', { class: 'cx-ui-upload-file__progress' }, [
                h('div', {
                  class: 'cx-ui-upload-file__progress-bar',
                  style: { width: `${file.percentage}%` },
                }),
              ]),
            );
          }
          return h(
            'li',
            { class: resolveUploadFileClassList({ status: file.status }) },
            fileChildren,
          );
        });
        children.push(h('ul', { class: 'cx-ui-upload__file-list' }, listChildren));
      }

      return h('div', { class: classList.value, attrs: { ...attrs } }, children);
    };
  },
});
