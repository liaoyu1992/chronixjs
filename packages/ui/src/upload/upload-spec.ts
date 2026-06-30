/**
 * Upload IR. File upload with trigger button
 * and file list with status tracking.
 */

export type UploadFileStatus = 'pending' | 'uploading' | 'finished' | 'error' | 'removed';

export interface UploadFileInfo {
  readonly id: string;
  readonly name: string;
  readonly status: UploadFileStatus;
  readonly percentage?: number;
  readonly url?: string;
  readonly file?: File;
}

export interface UploadProps {
  /** Upload endpoint URL. */
  readonly action?: string;
  /** Managed file list. */
  readonly fileList?: readonly UploadFileInfo[];
  /** Accepted file types (MIME or extension). */
  readonly accept?: string;
  /** Allow multiple files. */
  readonly multiple?: boolean | undefined;
  /** Allow directory upload. */
  readonly directory?: boolean | undefined;
  /** Disable the upload trigger. */
  readonly disabled?: boolean | undefined;
}

export const defaultUploadProps: UploadProps = {
  multiple: false,
  directory: false,
  disabled: false,
};
