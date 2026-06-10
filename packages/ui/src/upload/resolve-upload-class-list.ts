import type { UploadProps, UploadFileStatus } from './upload-spec.js';

export function resolveUploadClassList(props: Pick<UploadProps, 'disabled'>): string[] {
  const classes: string[] = ['cx-ui-upload'];

  if (props.disabled === true) {
    classes.push('cx-ui-upload--disabled');
  }

  return classes;
}

export function resolveUploadFileClassList(input: { status: UploadFileStatus }): string[] {
  const classes: string[] = ['cx-ui-upload-file'];
  classes.push(`cx-ui-upload-file--${input.status}`);
  return classes;
}
