export type { TabItem, TabsPlacement, TabsProps, TabsSize, TabsType } from './tabs-spec.js';
export {
  defaultTabsProps,
  findTabItemByKey,
  getActivatableTabKeys,
  reorderTabItems,
  tabsUsesVerticalKeyboardNav,
} from './tabs-spec.js';
export type {
  ResolveTabItemClassListInput,
  ResolveTabsAddButtonClassListInput,
  ResolveTabsClassListInput,
} from './resolve-tabs-class-list.js';
export {
  resolveTabItemClassList,
  resolveTabsAddButtonClassList,
  resolveTabsClassList,
} from './resolve-tabs-class-list.js';
export { CHRONIX_TABS_CSS, ensureChronixTabsStyles } from './tabs-styles.js';
