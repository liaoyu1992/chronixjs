import { hasIcon } from './icon-registry.js';

import type { IconProps } from './icon-props.js';

export function resolveIconClassList(props: IconProps): string[] {
  const classes = ['cx-ui-icon'];
  if (!hasIcon(props.name)) classes.push('cx-ui-icon--missing');
  return classes;
}
