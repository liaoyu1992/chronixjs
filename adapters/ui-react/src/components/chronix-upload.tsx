import {
  createUploadFileId,
  defaultUploadProps,
  ensureChronixUploadStyles,
  resolveUploadClassList,
  resolveUploadFileClassList,
  type UploadFileInfo,
  type UploadProps,
} from '@chronixjs/ui';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ChangeEvent as ReactChangeEvent,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

export interface ChronixUploadProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onChange'
> {
  readonly action?: string;
  readonly fileList?: readonly UploadFileInfo[];
  readonly accept?: string;
  readonly multiple?: boolean | undefined;
  readonly disabled?: boolean | undefined;
  readonly onChange?: (fileList: UploadFileInfo[]) => void;
  readonly children?: ReactNode;
}

/**
 * `<ChronixUpload>` — React 18 port of the Phase 35 Upload.
 * Renders a hidden file input, a trigger element, and a file list
 * with status tracking per file.
 */
export function ChronixUpload(props: ChronixUploadProps): JSX.Element {
  const {
    action: _action,
    fileList = [],
    accept,
    multiple = defaultUploadProps.multiple,
    disabled = defaultUploadProps.disabled,
    onChange,
    children,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixUploadStyles();
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);

  const resolvedProps = useMemo<Pick<UploadProps, 'disabled'>>(() => ({ disabled }), [disabled]);

  const classList = useMemo(() => resolveUploadClassList(resolvedProps).join(' '), [resolvedProps]);

  const handleTrigger = useCallback(() => {
    if (disabled) return;
    inputRef.current?.click();
  }, [disabled]);

  const handleChange = useCallback(
    (event: ReactChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files === null || files.length === 0) return;

      const newFiles: UploadFileInfo[] = Array.from(files).map((file) => ({
        id: createUploadFileId(),
        name: file.name,
        status: 'pending' as const,
        file,
      }));

      onChange?.([...fileList, ...newFiles]);

      // Reset the input so the same file can be re-selected
      event.target.value = '';
    },
    [fileList, onChange],
  );

  return (
    <div data-testid="upload-root" className={classList} {...rest}>
      {children !== undefined ? (
        <div className="cx-ui-upload__trigger" onClick={handleTrigger}>
          {children}
        </div>
      ) : (
        <button
          type="button"
          className="cx-ui-upload__trigger"
          disabled={disabled}
          onClick={handleTrigger}
        >
          Upload
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        className="cx-ui-upload__input"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      {fileList.length > 0 ? (
        <div className="cx-ui-upload__file-list">
          {fileList.map((file) => (
            <div key={file.id} className={resolveUploadFileClassList(file).join(' ')}>
              <span className="cx-ui-upload__file-name">{file.name}</span>
              <span className="cx-ui-upload__file-status">{file.status}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
