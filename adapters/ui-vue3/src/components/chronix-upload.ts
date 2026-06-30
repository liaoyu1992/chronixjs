import {
  createUploadFileId,
  defaultUploadProps,
  ensureChronixUploadStyles,
  resolveUploadClassList,
  resolveUploadFileClassList,
  type UploadFileInfo,
  type UploadProps,
} from '@chronixjs/ui';
import { computed, defineComponent, h, ref, type VNode } from 'vue';

/**
 * `<ChronixUpload>` — Vue 3 file upload component.
 * .
 *
 * Props:
 *
 * - `action` — upload endpoint URL.
 * - `fileList` — managed file list array.
 * - `accept` — accepted file types (MIME or extension).
 * - `multiple` — allow multiple file selection (default false).
 * - `disabled` — disable the upload trigger (default false).
 *
 * Emits:
 *
 * - `update:file-list` — emitted when files are added or removed.
 * - `change` — emitted when the file list changes.
 */
export const ChronixUpload = defineComponent({
  name: 'ChronixUpload',
  inheritAttrs: false,
  props: {
    action: {
      type: String as () => string | undefined,
      default: defaultUploadProps.action,
    },
    fileList: {
      type: Array as () => readonly UploadFileInfo[],
      default: () => defaultUploadProps.fileList ?? [],
    },
    accept: {
      type: String as () => string | undefined,
      default: defaultUploadProps.accept,
    },
    multiple: {
      type: Boolean,
      default: defaultUploadProps.multiple,
    },
    disabled: {
      type: Boolean,
      default: defaultUploadProps.disabled,
    },
  },
  emits: {
    'update:file-list': (_fileList: UploadFileInfo[]) => true,
    change: (_fileList: UploadFileInfo[]) => true,
  },
  setup(props, { emit, attrs }) {
    ensureChronixUploadStyles();

    const inputRef = ref<HTMLInputElement | null>(null);

    const resolvedProps = computed<UploadProps>(() => ({
      action: props.action,
      fileList: props.fileList,
      accept: props.accept,
      multiple: props.multiple,
      disabled: props.disabled,
    }));

    const classList = computed(() =>
      resolveUploadClassList({ disabled: resolvedProps.value.disabled }),
    );

    function onTriggerClick(): void {
      if (props.disabled) return;
      inputRef.value?.click();
    }

    function onFileInputChange(event: Event): void {
      const target = event.target as HTMLInputElement;
      const files = target.files;
      if (!files || files.length === 0) return;

      const newFiles: UploadFileInfo[] = [];
      for (const file of files) {
        newFiles.push({
          id: createUploadFileId(),
          name: file.name,
          status: 'pending',
          file,
        });
      }

      const next = [...props.fileList, ...newFiles];
      emit('update:file-list', next);
      emit('change', next);

      // Reset the input so the same file can be selected again
      target.value = '';
    }

    function onRemoveFile(index: number): void {
      const next = [...props.fileList];
      next.splice(index, 1);
      emit('update:file-list', next);
      emit('change', next);
    }

    return () => {
      const children: VNode[] = [];

      // Hidden file input
      children.push(
        h('input', {
          ref: inputRef,
          type: 'file',
          class: 'cx-ui-upload__input',
          accept: props.accept,
          multiple: props.multiple,
          style: { display: 'none' },
          onChange: onFileInputChange,
        }),
      );

      // Trigger button
      children.push(
        h(
          'button',
          {
            type: 'button',
            class: 'cx-ui-upload__trigger',
            disabled: props.disabled,
            onClick: onTriggerClick,
          },
          'Upload',
        ),
      );

      // File list
      if (props.fileList.length > 0) {
        const fileNodes = props.fileList.map((file, index) =>
          h(
            'div',
            {
              key: file.id,
              class: resolveUploadFileClassList({ status: file.status }).join(' '),
            },
            [
              h('span', { class: 'cx-ui-upload-file__name' }, file.name),
              h(
                'button',
                {
                  type: 'button',
                  class: 'cx-ui-upload-file__remove',
                  onClick: () => onRemoveFile(index),
                },
                '×',
              ),
            ],
          ),
        );
        children.push(h('div', { class: 'cx-ui-upload__file-list' }, fileNodes));
      }

      return h(
        'div',
        {
          class: classList.value,
          'data-testid': 'upload-root',
          ...attrs,
        },
        children,
      );
    };
  },
});
