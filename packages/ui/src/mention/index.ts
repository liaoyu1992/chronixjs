export type {
  MentionProps,
  MentionTriggerResult,
  MentionSource,
  MentionFilterFn,
} from './mention-spec.js';
export {
  defaultMentionProps,
  detectMentionTrigger,
  detectMultiMentionTrigger,
} from './mention-spec.js';

export type { ResolveMentionRootClassListInput } from './resolve-mention-class-list.js';
export {
  resolveMentionRootClassList,
  resolveMentionTextareaClassList,
  resolveMentionDropdownClassList,
  resolveMentionOptionClassList,
  resolveMentionEmptyClassList,
} from './resolve-mention-class-list.js';

export { CHRONIX_MENTION_CSS, ensureChronixMentionStyles } from './mention-styles.js';
