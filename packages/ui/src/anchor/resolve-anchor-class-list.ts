import type { AnchorProps } from './anchor-spec.js';

export function resolveAnchorClassList(
  props: Pick<AnchorProps, 'showRail' | 'showBackground'>,
): string[] {
  const classes: string[] = ['cx-ui-anchor'];

  if (props.showRail !== false) {
    classes.push('cx-ui-anchor--show-rail');
  }
  if (props.showBackground !== false) {
    classes.push('cx-ui-anchor--show-background');
  }

  return classes;
}
