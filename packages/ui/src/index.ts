/**
 * @chronixjs/ui — framework-agnostic UI component IR.
 *
 * Mirrors the chronix-table architecture: pure-data types + pure-function
 * helpers in this core package; framework adapters in
 * `@chronixjs/ui-{vue3,vue2,react}` wrap the IR with DOM rendering.
 *
 * Phase 0 (2026-06-01): package skeleton + Phase 0.1/0.2/0.3 foundation
 *   design decisions ratified (see audit/UI_PHASE_0_*_DESIGN.md).
 * Phase 1 (2026-06-01): theme token system — ChronixUITheme interface +
 *   nested per-component slices + light/dark presets + cssVarsForUITheme
 *   pure converter + mergeChronixUITheme deep-merge helper. See `./theme/`.
 * Phase 2 (2026-06-02): ConfigProvider context — ChronixUIContext
 *   pure-data interface (theme / locale / size / clsPrefix / disabled /
 *   portalContainer / rtl / componentOverrides) + createDefaultUIContext
 *   factory + mergeUIContext deep-merge helper. See `./context/`.
 * Phase 3 (2026-06-02): locale system — extends the Phase 2 ChronixLocale
 *   stub with a nested common slice + 3 preset locales (en-US / zh-CN /
 *   ja-JP) + mergeLocales deep-merge + localeRegistry runtime registry.
 *   Per-component locale slices (DatePicker, Form, …) land in their
 *   respective component phases. See `./locale/`.
 * Phase 4 (2026-06-02): popup spec — framework-agnostic popup positioning
 *   for all floating-element components (Popover, Tooltip, Select,
 *   DatePicker, Cascader, AutoComplete, Mention, ColorPicker, Dropdown,
 *   Popconfirm, Popselect, FloatButton). Ships PopupSpec types + 12-way
 *   placement enum + resolvePopupPlacement orchestrator + 3 pure helpers
 *   (computePopupBaseCoords / flipPopupOnOverflow / clampPopupToViewport).
 *   See `./popup/`.
 * Phase 5 (2026-06-02): tree-traversal helpers — TreeNodeSpec<T> +
 *   TreeKeyPath types + 6 pure helpers (traverseTreePreOrder /
 *   traverseTreePostOrder / flattenTree / filterTree / mapTree /
 *   collectDescendantKeys / findTreeNode). Used by Tree, Cascader,
 *   TreeSelect, Menu, Dropdown. See `./tree/`.
 * Phase 6 (2026-06-02): form validation IR — wraps `async-validator`
 *   (optional peer dep) behind chronix-NEW pure-async helpers.
 *   Ships FieldSpec / FormSpec / FieldError / FormValidationResult
 *   types, FieldState reactive state + 6 transactions, validateField
 *   single-field validator, validateForm full-form validator. See
 *   `./form/`. Required by Form, Input, Select, DatePicker, and any
 *   component consuming user input with constraints.
 * Phase 7 (2026-06-02): input coercion helpers — number input
 *   (parseNumberInput / clampNumberInput / formatNumberInput),
 *   keyboard list-navigation (composeKeyboardSelection), IME
 *   composition state-machine (ImeCompositionState + 4 transactions).
 *   See `./input/`. Used by Input, InputNumber, Select, Cascader,
 *   Dropdown, Menu, AutoComplete, Mention.
 * Phase 8 (2026-06-02): transition IR — declarative spec
 *   (TransitionSpec / defaultTransitionSpec) + 6-phase style builders
 *   (buildFadeTransitionStyles / buildZoomTransitionStyles /
 *   buildSlideTransitionStyles with 4 directions) +
 *   formatCssTransitionShorthand helper. See `./transition/`. Used by
 *   Modal, Drawer, Popover, Tooltip, Popconfirm, Tabs, Carousel.
 * Phase 9 (2026-06-02): icon registry — pure-data SVG IconSpec +
 *   IconPathSpec types + process-global registry (registerIcon /
 *   getIcon / hasIcon / listIconNames) pre-registered with 12
 *   chronix-NEW default icons (4 chevrons + close + check + minus +
 *   search + info + warning + error + success). See `./icon/`. Used by
 *   Tree, Select, Cascader, Checkbox, Modal, Drawer, Alert, Input.
 * Phase 11 (2026-06-02): Button IR — first Tier A component through
 *   the full pipeline. ButtonProps + defaultButtonProps +
 *   resolveButtonClassList pure helper consumed by adapter ChronixButton
 *   SFCs. See `./button/`. Theme tokens were pre-shipped in Phase 1's
 *   `button` slice; Phase 11 ships only Vue 3 adapter (Phase 12 ports
 *   Vue 2 + React).
 */

export const UI_PACKAGE_VERSION = '0.1.0-alpha.0';

export {
  cssVarsForUITheme,
  defaultChronixUITheme,
  defaultChronixUIThemeDark,
  mergeChronixUITheme,
  type ChronixButtonTheme,
  type ChronixUITheme,
  type ChronixUIThemeCommon,
  type ChronixUIThemeOverrides,
} from './theme/index.js';

export {
  defaultEnUSLocale,
  defaultJaJPLocale,
  defaultZhCNLocale,
  getLocale,
  hasLocale,
  listLocaleNames,
  mergeLocales,
  registerLocale,
  type ChronixLocale,
  type ChronixLocaleCommon,
  type ChronixLocaleOverrides,
} from './locale/index.js';

export {
  createDefaultUIContext,
  mergeUIContext,
  type ChronixUIComponentOverrides,
  type ChronixUIContext,
  type ChronixUIContextOverrides,
} from './context/index.js';

export {
  DEFAULT_FOCUSABLE_SELECTOR,
  DEFAULT_HOVER_ENTER_DELAY_MS,
  DEFAULT_HOVER_LEAVE_DELAY_MS,
  DEFAULT_POPUP_TRIGGER,
  clampPopupToViewport,
  computePopupBaseCoords,
  defaultPopupSpec,
  flipPopupOnOverflow,
  getBodyScrollLockCountForTests,
  getFirstFocusable,
  getFocusableElements,
  getLastFocusable,
  lockBodyScroll,
  nextPopupZIndex,
  resetBodyScrollLockForTests,
  resetPopupZIndexForTests,
  resolvePopupPlacement,
  unlockBodyScroll,
  type DOMRectLike,
  type PopupPlacement,
  type PopupPlacementInput,
  type PopupPlacementResult,
  type PopupSpec,
  type PopupTrigger,
} from './popup/index.js';

export {
  collectDescendantKeys,
  filterTree,
  findTreeNode,
  flattenTree,
  mapTree,
  traverseTreePostOrder,
  traverseTreePreOrder,
  type FlatTreeEntry,
  type TreeFilterPredicate,
  type TreeKeyPath,
  type TreeNodeLookup,
  type TreeNodeSpec,
  type TreeVisitor,
} from './tree/index.js';

export {
  CHRONIX_FORM_CSS,
  createFieldState,
  defaultFormProps,
  defaultFormItemProps,
  ensureChronixFormStyles,
  getNestedValue,
  isFieldRequired,
  resetFieldState,
  resolveFormBlankClassList,
  resolveFormClassList,
  resolveFormFeedbackClassList,
  resolveFormItemClassList,
  resolveFormLabelClassList,
  validateField,
  validateForm,
  withFieldErrors,
  withFieldTouched,
  withFieldValidating,
  withFieldValue,
  type FieldError,
  type FieldSpec,
  type FieldState,
  type FormItemProps,
  type FormLabelAlign,
  type FormLabelPlacement,
  type FormProps,
  type FormSize,
  type FormSpec,
  type FormValidationResult,
  type ValidationRule,
} from './form/index.js';

export {
  clampNumberInput,
  composeKeyboardSelection,
  createImeCompositionState,
  formatNumberInput,
  parseNumberInput,
  withCompositionEnd,
  withCompositionStart,
  withCompositionUpdate,
  type ClampNumberInputOptions,
  type ComposeKeyboardSelectionInput,
  type FormatNumberInputOptions,
  type ImeCompositionState,
  type KeyboardSelectionDirection,
  type ParseNumberInputOptions,
} from './input/index.js';

export {
  DEFAULT_TRANSITION_DURATION_MS,
  DEFAULT_TRANSITION_EASING,
  buildFadeTransitionStyles,
  buildHeightCollapseTransitionStyles,
  buildSlideTransitionStyles,
  buildZoomTransitionStyles,
  defaultTransitionSpec,
  formatCssTransitionShorthand,
  type SlideDirection,
  type TransitionPhaseStyles,
  type TransitionSpec,
} from './transition/index.js';

export {
  DEFAULT_ICONS,
  DEFAULT_ICON_VIEW_BOX,
  getIcon,
  hasIcon,
  listIconNames,
  registerIcon,
  type IconPathSpec,
  type IconSpec,
} from './icon/index.js';

export {
  CHRONIX_BUTTON_CSS,
  defaultButtonProps,
  ensureChronixButtonStyles,
  resolveButtonClassList,
  type ButtonHtmlType,
  type ButtonProps,
  type ButtonSize,
  type ButtonVariant,
} from './button/index.js';

export {
  CHRONIX_TAG_CSS,
  defaultTagProps,
  ensureChronixTagStyles,
  resolveTagClassList,
  type TagProps,
  type TagSize,
  type TagType,
} from './tag/index.js';

export {
  CHRONIX_DIVIDER_CSS,
  defaultDividerProps,
  ensureChronixDividerStyles,
  resolveDividerClassList,
  type DividerProps,
  type DividerTitlePlacement,
} from './divider/index.js';

export {
  CHRONIX_BADGE_CSS,
  defaultBadgeProps,
  ensureChronixBadgeStyles,
  formatBadgeValue,
  resolveBadgeClassList,
  resolveBadgeSupClassList,
  type BadgeProps,
  type BadgeType,
} from './badge/index.js';

export {
  CHRONIX_ALERT_CSS,
  defaultAlertProps,
  ensureChronixAlertStyles,
  resolveAlertClassList,
  type AlertProps,
  type AlertType,
} from './alert/index.js';

export {
  CHRONIX_CARD_CSS,
  defaultCardProps,
  ensureChronixCardStyles,
  resolveCardClassList,
  type CardProps,
  type CardSize,
} from './card/index.js';

export {
  CHRONIX_EMPTY_CSS,
  defaultEmptyProps,
  ensureChronixEmptyStyles,
  resolveEmptyClassList,
  type EmptyProps,
  type EmptySize,
} from './empty/index.js';

export {
  CHRONIX_SPIN_CSS,
  defaultSpinProps,
  ensureChronixSpinStyles,
  resolveSpinClassList,
  type SpinProps,
  type SpinSize,
} from './spin/index.js';

export {
  CHRONIX_PROGRESS_CSS,
  defaultProgressProps,
  ensureChronixProgressStyles,
  formatProgressPercentage,
  resolveProgressClassList,
  type FormattedProgressPercentage,
  type ProgressIndicatorPlacement,
  type ProgressProps,
  type ProgressType,
} from './progress/index.js';

export {
  CHRONIX_SKELETON_CSS,
  defaultSkeletonProps,
  ensureChronixSkeletonStyles,
  formatSkeletonSize,
  resolveSkeletonClassList,
  type SkeletonProps,
  type SkeletonShape,
} from './skeleton/index.js';

export {
  CHRONIX_SPACE_CSS,
  defaultSpaceProps,
  ensureChronixSpaceStyles,
  resolveSpaceClassList,
  resolveSpaceGap,
  type SpaceAlign,
  type SpaceJustify,
  type SpaceProps,
  type SpaceSize,
} from './space/index.js';

export {
  CHRONIX_FLEX_CSS,
  defaultFlexProps,
  ensureChronixFlexStyles,
  resolveFlexClassList,
  resolveFlexGap,
  type FlexAlign,
  type FlexDirection,
  type FlexGap,
  type FlexJustify,
  type FlexProps,
  type FlexWrap,
} from './flex/index.js';

export {
  CHRONIX_GRID_CSS,
  defaultGridProps,
  ensureChronixGridStyles,
  resolveGridClassList,
  resolveGridGap,
  resolveGridTracks,
  type GridGapStyle,
  type GridProps,
} from './grid/index.js';

export {
  CHRONIX_RESULT_CSS,
  RESULT_ICON_BY_STATUS,
  defaultResultProps,
  ensureChronixResultStyles,
  resolveResultClassList,
  type ResultProps,
  type ResultStatus,
} from './result/index.js';

export {
  CHRONIX_STATISTIC_CSS,
  STATISTIC_PLACEHOLDER,
  defaultStatisticProps,
  ensureChronixStatisticStyles,
  formatStatisticValue,
  resolveStatisticClassList,
  type StatisticProps,
} from './statistic/index.js';

export {
  CHRONIX_COUNTDOWN_CSS,
  computeCountdownTickIntervalMs,
  defaultCountdownProps,
  ensureChronixCountdownStyles,
  formatCountdownDuration,
  resolveCountdownClassList,
  type CountdownPrecision,
  type CountdownProps,
} from './countdown/index.js';

export {
  CHRONIX_PAGE_HEADER_CSS,
  PAGE_HEADER_BACK_ICON_PLACEHOLDER,
  defaultPageHeaderProps,
  ensureChronixPageHeaderStyles,
  resolvePageHeaderClassList,
  type PageHeaderClassListInput,
  type PageHeaderProps,
} from './page-header/index.js';

export {
  CHRONIX_BREADCRUMB_CSS,
  defaultBreadcrumbProps,
  ensureChronixBreadcrumbStyles,
  isBreadcrumbItemClickable,
  resolveBreadcrumbClassList,
  resolveBreadcrumbItemClassList,
  type BreadcrumbItem,
  type BreadcrumbProps,
} from './breadcrumb/index.js';

export {
  CHRONIX_STEPS_CSS,
  STEP_INDICATOR_ERROR_PLACEHOLDER,
  STEP_INDICATOR_FINISH_PLACEHOLDER,
  defaultStepsProps,
  deriveStepItemStatus,
  ensureChronixStepsStyles,
  getStepIndicatorContent,
  resolveStepItemClassList,
  resolveStepsClassList,
  type StepItem,
  type StepStatus,
  type StepsDirection,
  type StepsProps,
} from './steps/index.js';

export {
  CHRONIX_TIMELINE_CSS,
  defaultTimelineProps,
  ensureChronixTimelineStyles,
  resolveTimelineClassList,
  resolveTimelineItemClassList,
  type TimelineItem,
  type TimelineItemColor,
  type TimelineItemLineType,
  type TimelineProps,
} from './timeline/index.js';

export {
  CHRONIX_DESCRIPTIONS_CSS,
  defaultDescriptionsProps,
  ensureChronixDescriptionsStyles,
  resolveDescriptionItemSpanStyle,
  resolveDescriptionsClassList,
  resolveDescriptionsGridTemplateColumns,
  type DescriptionItem,
  type DescriptionItemSpanStyle,
  type DescriptionsClassListInput,
  type DescriptionsLabelPlacement,
  type DescriptionsProps,
  type DescriptionsSize,
} from './descriptions/index.js';

export {
  CHRONIX_LIST_CSS,
  defaultListProps,
  ensureChronixListStyles,
  resolveListClassList,
  resolveListItemClassList,
  type ListItem,
  type ListProps,
  type ListSize,
} from './list/index.js';

export {
  CHRONIX_WATERMARK_CSS,
  defaultWatermarkProps,
  encodeWatermarkSvgDataUrl,
  ensureChronixWatermarkStyles,
  resolveWatermarkClassList,
  type WatermarkProps,
} from './watermark/index.js';

export {
  CHRONIX_QRCODE_CSS,
  defaultQrCodeProps,
  encodeQrCodeMatrix,
  ensureChronixQrCodeStyles,
  getRegisteredQrCodeEncoder,
  registerQrCodeEncoder,
  resolveQrCodeClassList,
  type QrCodeErrorCorrectionLevel,
  type QrCodeFactory,
  type QrCodeProps,
} from './qrcode/index.js';

export {
  CHRONIX_MARQUEE_CSS,
  computeMarqueeAnimationDurationSec,
  defaultMarqueeProps,
  encodeMarqueeKeyframes,
  ensureChronixMarqueeStyles,
  resolveMarqueeClassList,
  type MarqueeDirection,
  type MarqueeProps,
} from './marquee/index.js';

export {
  CHRONIX_ELLIPSIS_CSS,
  defaultEllipsisProps,
  ensureChronixEllipsisStyles,
  resolveEllipsisClassList,
  type EllipsisProps,
} from './ellipsis/index.js';

export {
  CHRONIX_THING_CSS,
  defaultThingProps,
  ensureChronixThingStyles,
  resolveThingClassList,
  type ThingClassListInput,
  type ThingProps,
} from './thing/index.js';

export {
  CHRONIX_LOG_CSS,
  defaultLogProps,
  ensureChronixLogStyles,
  resolveLogClassList,
  type LogProps,
} from './log/index.js';

export {
  CHRONIX_BUTTON_GROUP_CSS,
  defaultButtonGroupProps,
  ensureChronixButtonGroupStyles,
  resolveButtonGroupClassList,
  type ButtonGroupProps,
} from './button-group/index.js';

export {
  CHRONIX_ELEMENT_CSS,
  defaultElementProps,
  ensureChronixElementStyles,
  resolveElementClassList,
  type ElementProps,
} from './element/index.js';

export {
  CHRONIX_TYPOGRAPHY_CSS,
  defaultTypographyProps,
  ensureChronixTypographyStyles,
  getTypographyTag,
  resolveTypographyClassList,
  type TypographyLevel,
  type TypographyProps,
  type TypographyVariant,
} from './typography/index.js';

export {
  CHRONIX_CODE_CSS,
  defaultCodeProps,
  ensureChronixCodeStyles,
  resolveCodeClassList,
  type CodeProps,
} from './code/index.js';

export {
  CHRONIX_GRADIENT_TEXT_CSS,
  buildGradientTextBackground,
  defaultGradientTextProps,
  ensureChronixGradientTextStyles,
  resolveGradientTextClassList,
  type GradientTextProps,
} from './gradient-text/index.js';

export {
  CHRONIX_HIGHLIGHT_CSS,
  defaultHighlightProps,
  ensureChronixHighlightStyles,
  resolveHighlightClassList,
  splitHighlightSegments,
  type HighlightProps,
  type HighlightSegment,
} from './highlight/index.js';

export {
  CHRONIX_AVATAR_CSS,
  defaultAvatarProps,
  ensureChronixAvatarStyles,
  resolveAvatarClassList,
  resolveAvatarContent,
  type AvatarContentInput,
  type AvatarProps,
  type AvatarShape,
} from './avatar/index.js';

export {
  CHRONIX_AVATAR_GROUP_CSS,
  defaultAvatarGroupProps,
  ensureChronixAvatarGroupStyles,
  resolveAvatarGroupClassList,
  splitAvatarGroupItems,
  type AvatarGroupProps,
  type AvatarGroupSplit,
  type AvatarItem,
} from './avatar-group/index.js';

export {
  CHRONIX_ICON_WRAPPER_CSS,
  defaultIconWrapperProps,
  ensureChronixIconWrapperStyles,
  resolveIconWrapperClassList,
  type IconWrapperProps,
} from './icon-wrapper/index.js';

export {
  CHRONIX_ICON_CSS,
  defaultIconProps,
  ensureChronixIconStyles,
  resolveIconClassList,
  resolveIconRenderMode,
  type IconProps,
} from './icon/index.js';

export {
  CHRONIX_EQUATION_CSS,
  defaultEquationProps,
  ensureChronixEquationStyles,
  resolveEquationClassList,
  type EquationDisplay,
  type EquationProps,
} from './equation/index.js';

export {
  CHRONIX_HEATMAP_CSS,
  defaultHeatmapProps,
  ensureChronixHeatmapStyles,
  findHeatmapValueRange,
  interpolateHeatmapColor,
  resolveHeatmapClassList,
  type HeatmapProps,
  type HeatmapValueRange,
} from './heatmap/index.js';

/*
 * Phase 25 (2026-06-03) — Tier B form inputs (8 components).
 * Input (variant=text|textarea) + InputOtp + Checkbox + Radio + Switch
 * + Rate + InputNumber + AutoComplete. See `audit/UI_PHASE_25_TIER_B_FORM_INPUTS_DESIGN.md`.
 * Input lives inside `./input/` (co-located with Phase 7 input helpers);
 * remaining 7 each have their own directory.
 */

export {
  CHRONIX_INPUT_OTP_CSS,
  buildOtpCells,
  defaultInputOtpProps,
  ensureChronixInputOtpStyles,
  resolveInputOtpClassList,
  type InputOtpProps,
} from './input-otp/index.js';

export {
  CHRONIX_CHECKBOX_CSS,
  defaultCheckboxProps,
  ensureChronixCheckboxStyles,
  resolveCheckboxClassList,
  resolveCheckboxIconState,
  type CheckboxIconState,
  type CheckboxProps,
} from './checkbox/index.js';

export {
  CHRONIX_RADIO_CSS,
  defaultRadioGroupProps,
  defaultRadioProps,
  ensureChronixRadioStyles,
  resolveRadioClassList,
  resolveRadioGroupClassList,
  type RadioGroupProps,
  type RadioOption,
  type RadioProps,
} from './radio/index.js';

export {
  CHRONIX_SWITCH_CSS,
  defaultSwitchProps,
  ensureChronixSwitchStyles,
  resolveSwitchClassList,
  type SwitchProps,
  type SwitchSize,
} from './switch/index.js';

export {
  CHRONIX_RATE_CSS,
  defaultRateProps,
  ensureChronixRateStyles,
  resolveRateClassList,
  resolveRateStarState,
  type RateProps,
  type RateStarState,
} from './rate/index.js';

export {
  CHRONIX_INPUT_NUMBER_CSS,
  defaultInputNumberProps,
  ensureChronixInputNumberStyles,
  resolveInputNumberClassList,
  type InputNumberProps,
  type InputNumberSize,
} from './input-number/index.js';

export {
  CHRONIX_AUTOCOMPLETE_CSS,
  defaultAutoCompleteProps,
  ensureChronixAutoCompleteStyles,
  filterAutoCompleteOptions,
  resolveAutoCompleteClassList,
  type AutoCompleteOption,
  type AutoCompleteProps,
  type AutoCompleteSize,
  type ResolveAutoCompleteClassListInput,
} from './autocomplete/index.js';

export {
  CHRONIX_INPUT_CSS,
  defaultInputProps,
  ensureChronixInputStyles,
  getInputInnerTag,
  resolveInputClassList,
  type InputProps,
  type InputSize,
  type InputType,
} from './input/index.js';

/*
 * Phase 26 (2026-06-03) — Popover infrastructure (4 components).
 * Popover + Tooltip + Popconfirm + PopSelect. See
 * `audit/UI_PHASE_26_POPOVER_INFRA_DESIGN.md`. Shared popup helpers
 * (PopupTrigger + nextPopupZIndex) exported from `./popup/` above.
 */

export {
  CHRONIX_POPOVER_CSS,
  defaultPopoverProps,
  ensureChronixPopoverStyles,
  resolvePopoverClassList,
  type PopoverProps,
  type ResolvePopoverClassListInput,
} from './popover/index.js';

export {
  CHRONIX_TOOLTIP_CSS,
  defaultTooltipProps,
  ensureChronixTooltipStyles,
  resolveTooltipClassList,
  type ResolveTooltipClassListInput,
  type TooltipProps,
} from './tooltip/index.js';

export {
  CHRONIX_POPCONFIRM_CSS,
  defaultPopconfirmProps,
  ensureChronixPopconfirmStyles,
  resolvePopconfirmClassList,
  type PopconfirmProps,
  type ResolvePopconfirmClassListInput,
} from './popconfirm/index.js';

export {
  CHRONIX_POP_SELECT_CSS,
  defaultPopSelectProps,
  ensureChronixPopSelectStyles,
  resolvePopSelectClassList,
  type PopSelectOption,
  type PopSelectProps,
  type ResolvePopSelectClassListInput,
} from './pop-select/index.js';

/*
 * Phase 27 (2026-06-03) — Popover-consuming Tier B (6 components).
 * Modal + Drawer + Dropdown + Menu + Affix + BackTop. See
 * `audit/UI_PHASE_27_POPOVER_CONSUMING_TIER_B_DESIGN.md`. Shared
 * popup helpers `getFocusableElements` / `getFirstFocusable` /
 * `getLastFocusable` / `lockBodyScroll` / `unlockBodyScroll`
 * exported from `./popup/` above.
 */

export {
  CHRONIX_MODAL_CSS,
  defaultModalProps,
  ensureChronixModalStyles,
  resolveModalWidthStyle,
  resolveModalWrapperClassList,
  type ModalCloseReason,
  type ModalProps,
  type ResolveModalClassListInput,
} from './modal/index.js';

export {
  CHRONIX_DRAWER_CSS,
  defaultDrawerProps,
  ensureChronixDrawerStyles,
  resolveDrawerDimensionStyle,
  resolveDrawerPanelClassList,
  resolveDrawerWrapperClassList,
  type DrawerCloseReason,
  type DrawerPlacement,
  type DrawerProps,
  type ResolveDrawerClassListInput,
} from './drawer/index.js';

export {
  CHRONIX_DROPDOWN_CSS,
  defaultDropdownProps,
  ensureChronixDropdownStyles,
  findDropdownOptionByKey,
  getDropdownActivatableKeys,
  resolveDropdownClassList,
  resolveDropdownOptionClassList,
  type DropdownOption,
  type DropdownProps,
  type ResolveDropdownClassListInput,
} from './dropdown/index.js';

export {
  CHRONIX_MENU_CSS,
  composeMenuTreeKeyboardSelection,
  defaultMenuProps,
  deriveInitialExpandedKeys,
  ensureChronixMenuStyles,
  findMenuItemByKey,
  findMenuParentKey,
  findMenuPath,
  flattenMenuTree,
  flattenMenuTreeKeys,
  resolveMenuClassList,
  resolveMenuItemClassList,
  type ComposeMenuTreeKeyboardSelectionInput,
  type ComposeMenuTreeKeyboardSelectionResult,
  type MenuItem,
  type MenuMode,
  type MenuProps,
  type MenuTreeNavDirection,
  type ResolveMenuClassListInput,
  type ResolveMenuItemClassListInput,
} from './menu/index.js';

export {
  CHRONIX_AFFIX_CSS,
  defaultAffixProps,
  ensureChronixAffixStyles,
  resolveAffixClassList,
  resolveAffixState,
  type AffixProps,
  type AffixResolveInput,
  type AffixResolveResult,
  type ResolveAffixClassListInput,
} from './affix/index.js';

export {
  CHRONIX_BACK_TOP_CSS,
  defaultBackTopProps,
  ensureChronixBackTopStyles,
  resolveBackTopClassList,
  resolveBackTopStyle,
  shouldShowBackTop,
  type BackTopBehavior,
  type BackTopProps,
  type ResolveBackTopClassListInput,
} from './back-top/index.js';

/*
 * Phase 28 (2026-06-04) — Layout family (8 components).
 * Layout (+ Header / Sider / Content / Footer) + Tabs + Collapse +
 * CollapseTransition + Split + Image + FloatButton + FloatButtonGroup.
 * See `audit/UI_PHASE_28_LAYOUT_FAMILY_DESIGN.md`. Phase 28 is the
 * FIRST real component-level consumer of Phase 8 `TransitionSpec`
 * (Collapse + CollapseTransition height transition via new core helper
 * `buildHeightCollapseTransitionStyles`, exported via the transition
 * module re-exports above) and the SECOND consumer of Phase 26
 * Popover infra (FloatButton hover tooltip + FloatButtonGroup
 * click/hover inline expand).
 */

export type {
  LayoutProps,
  LayoutSiderBreakpoint,
  LayoutSiderPlacement,
  LayoutSiderProps,
  ResolveLayoutClassListInput,
  ResolveLayoutSiderClassListInput,
} from './layout/index.js';
export {
  CHRONIX_LAYOUT_CSS,
  LAYOUT_SIDER_BREAKPOINT_PX,
  defaultLayoutProps,
  defaultLayoutSiderProps,
  ensureChronixLayoutStyles,
  resolveBreakpointMediaQuery,
  resolveLayoutClassList,
  resolveLayoutContentClassList,
  resolveLayoutFooterClassList,
  resolveLayoutHeaderClassList,
  resolveLayoutSiderClassList,
  resolveLayoutSiderWidthStyle,
} from './layout/index.js';

export type {
  ResolveTabItemClassListInput,
  ResolveTabsAddButtonClassListInput,
  ResolveTabsClassListInput,
  TabItem,
  TabsPlacement,
  TabsProps,
  TabsSize,
  TabsType,
} from './tabs/index.js';
export {
  CHRONIX_TABS_CSS,
  defaultTabsProps,
  ensureChronixTabsStyles,
  findTabItemByKey,
  getActivatableTabKeys,
  reorderTabItems,
  resolveTabItemClassList,
  resolveTabsAddButtonClassList,
  resolveTabsClassList,
  tabsUsesVerticalKeyboardNav,
} from './tabs/index.js';

export type {
  CollapseArrowPlacement,
  CollapseItem,
  CollapseProps,
  ResolveCollapseClassListInput,
  ResolveCollapseItemClassListInput,
} from './collapse/index.js';
export {
  CHRONIX_COLLAPSE_CSS,
  defaultCollapseProps,
  ensureChronixCollapseStyles,
  isCollapseItemExpanded,
  normalizeCollapseValue,
  resolveCollapseClassList,
  resolveCollapseItemClassList,
  toggleCollapseValue,
} from './collapse/index.js';

export type {
  CollapseTransitionProps,
  ResolveCollapseTransitionClassListInput,
} from './collapse-transition/index.js';
export {
  CHRONIX_COLLAPSE_TRANSITION_CSS,
  defaultCollapseTransitionProps,
  ensureChronixCollapseTransitionStyles,
  resolveCollapseTransitionClassList,
} from './collapse-transition/index.js';

export type { ResolveSplitClassListInput, SplitDirection, SplitProps } from './split/index.js';
export {
  CHRONIX_SPLIT_CSS,
  clampSplitSize,
  defaultSplitProps,
  ensureChronixSplitStyles,
  resolveSplitClassList,
  resolveSplitFirstPaneStyle,
  resolveSplitSizePx,
} from './split/index.js';

export type { ImageObjectFit, ImageProps, ResolveImageClassListInput } from './image/index.js';
export {
  CHRONIX_IMAGE_CSS,
  defaultImageProps,
  ensureChronixImageStyles,
  resolveImageClassList,
  resolveImageEffectiveSrc,
  resolveImageInlineStyle,
} from './image/index.js';

export type {
  FloatButtonProps,
  FloatButtonShape,
  FloatButtonType,
  ResolveFloatButtonClassListInput,
} from './float-button/index.js';
export {
  CHRONIX_FLOAT_BUTTON_CSS,
  defaultFloatButtonProps,
  ensureChronixFloatButtonStyles,
  resolveFloatButtonClassList,
  resolveFloatButtonPositionStyle,
} from './float-button/index.js';

export type {
  FloatButtonGroupProps,
  FloatButtonGroupTrigger,
  ResolveFloatButtonGroupClassListInput,
} from './float-button-group/index.js';
export {
  CHRONIX_FLOAT_BUTTON_GROUP_CSS,
  defaultFloatButtonGroupProps,
  ensureChronixFloatButtonGroupStyles,
  resolveFloatButtonGroupClassList,
} from './float-button-group/index.js';

/*
 * Phase 29 (2026-06-04) — Tier B remainder (3 components).
 * Carousel + Wave + FocusDetector. See
 * `audit/UI_PHASE_29_TIER_B_REMAINDER_DESIGN.md`. Carousel is the
 * FIRST real component-level consumer of Phase 8
 * `buildSlideTransitionStyles` (Phase 28 shipped Collapse height
 * transition; Phase 29 ships slide transition to a real consumer).
 * Wave + FocusDetector are pure CSS-effect + event-observer
 * primitives with no IR algorithm. **All Tier B for v0.1.0-alpha
 * DONE after Phase 29.**
 */

export type {
  CarouselDirection,
  CarouselItem,
  CarouselProps,
  ResolveCarouselClassListInput,
  ResolveCarouselDotClassListInput,
  ResolveCarouselSlideClassListInput,
  ResolveCarouselThumbnailClassListInput,
} from './carousel/index.js';
export {
  CHRONIX_CAROUSEL_CSS,
  DEFAULT_CAROUSEL_INTERVAL_MS,
  computeLazyVisibleRange,
  computeNextCarouselIndex,
  computePrevCarouselIndex,
  defaultCarouselProps,
  ensureChronixCarouselStyles,
  findCarouselItemByIndex,
  resolveCarouselClassList,
  resolveCarouselDotClassList,
  resolveCarouselSlideClassList,
  resolveCarouselSlideDirection,
  resolveCarouselThumbnailClassList,
} from './carousel/index.js';

export type { ResolveWaveClassListInput, WaveProps } from './wave/index.js';
export {
  CHRONIX_WAVE_CSS,
  DEFAULT_WAVE_DURATION_MS,
  defaultWaveProps,
  ensureChronixWaveStyles,
  resolveWaveClassList,
} from './wave/index.js';

export type {
  FocusDetectorProps,
  ResolveFocusDetectorClassListInput,
} from './focus-detector/index.js';
export {
  CHRONIX_FOCUS_DETECTOR_CSS,
  defaultFocusDetectorProps,
  ensureChronixFocusDetectorStyles,
  resolveFocusDetectorClassList,
  shouldEmitFocusDetectorEvent,
} from './focus-detector/index.js';

/*
 * Phase 30 (2026-06-04) — Tier C Tree 专场 (1 component).
 * ChronixTree single-select + intra-tree DnD reorder + virtual
 * scrolling + async load + keyboard navigation + filter.
 * **First Tier C component**. See `audit/UI_PHASE_30_TREE_DESIGN.md`.
 */

export type {
  ComposeTreeKeyboardSelectionInput,
  ComposeTreeKeyboardSelectionResult,
  ComputeTreeReorderTransactionInput,
  ComputeTreeReorderTransactionResult,
  ComputeTreeVirtualWindowInput,
  MergeAsyncLoadedChildrenInput,
  ResolveTreeArrowClassListInput,
  ResolveTreeClassListInput,
  ResolveTreeDropIndicatorClassListInput,
  ResolveTreeRowClassListInput,
  ResolveVisibleTreeRowsInput,
  TreeDropPosition,
  TreeKeyboardDirection,
  TreeNodeData,
  TreeProps,
  TreeReorderCancelReason,
  TreeVirtualWindow,
} from './tree/index.js';
export {
  CHRONIX_TREE_CSS,
  DEFAULT_TREE_ROW_HEIGHT_PX,
  DEFAULT_TREE_VIRTUAL_WINDOW_OVERSCAN,
  composeTreeKeyboardSelection,
  computeTreeReorderTransaction,
  computeTreeVirtualWindow,
  defaultTreeProps,
  detectTreeDropPosition,
  ensureChronixTreeStyles,
  isTreeNodeAncestor,
  mergeAsyncLoadedChildren,
  normalizeExpandedKeysProp,
  resolveTreeArrowClassList,
  resolveTreeClassList,
  resolveTreeDropIndicatorClassList,
  resolveTreeRowClassList,
  resolveVisibleTreeRows,
} from './tree/index.js';

/*
 * Phase 31 (2026-06-04) — Tier C Select family (4 components).
 * Select + TreeSelect + Cascader + Mention. See
 * `audit/UI_PHASE_31_SELECT_FAMILY_DESIGN.md`. Shared `OptionSpec`
 * IR unifies all 4 components' option format; Select upgrades Phase 26
 * PopSelect with multiple/filterable/virtual scrolling. TreeSelect
 * composes Select trigger + Phase 30 Tree IR helpers. Cascader is a
 * multi-level Select variant. Mention is a textarea @trigger + Select
 * dropdown. **First Tier C Select component**.
 */

export type { OptionSpec, OptionGroupSpec, SelectOption } from './select/index.js';
export {
  isOptionGroup,
  normalizeSelectValue,
  flattenSelectOptions,
  filterSelectOptions,
  defaultSelectProps,
  resolveSelectRootClassList,
  resolveSelectTriggerClassList,
  resolveSelectDropdownClassList,
  resolveSelectOptionClassList,
  resolveSelectArrowClassList,
  resolveSelectEmptyClassList,
  resolveSelectTagClassList,
  resolveSelectTagCloseClassList,
  resolveSelectFilterInputClassList,
  CHRONIX_SELECT_CSS,
  ensureChronixSelectStyles,
} from './select/index.js';
export type {
  SelectProps,
  FlatOptionEntry,
  ResolveSelectRootClassListInput,
  ResolveSelectTriggerClassListInput,
  ResolveSelectDropdownClassListInput,
  ResolveSelectOptionClassListInput,
} from './select/index.js';

export type { TreeSelectProps } from './tree-select/index.js';
export {
  defaultTreeSelectProps,
  resolveTreeSelectRootClassList,
  resolveTreeSelectTriggerClassList,
  resolveTreeSelectDropdownClassList,
  resolveTreeSelectTreeClassList,
  resolveTreeSelectRowClassList,
  resolveTreeSelectArrowClassList,
  resolveTreeSelectEmptyClassList,
  resolveTreeSelectTagClassList,
  resolveTreeSelectTagCloseClassList,
  CHRONIX_TREE_SELECT_CSS,
  ensureChronixTreeSelectStyles,
} from './tree-select/index.js';
export type { ResolveTreeSelectRootClassListInput } from './tree-select/index.js';

export type { CascaderProps, CascaderPanel } from './cascader/index.js';
export {
  defaultCascaderProps,
  resolveCascaderPathLabels,
  resolveCascaderRootClassList,
  resolveCascaderTriggerClassList,
  resolveCascaderDropdownClassList,
  resolveCascaderPanelClassList,
  resolveCascaderOptionClassList,
  resolveCascaderArrowClassList,
  resolveCascaderEmptyClassList,
  resolveCascaderTagClassList,
  resolveCascaderTagCloseClassList,
  CHRONIX_CASCADER_CSS,
  ensureChronixCascaderStyles,
} from './cascader/index.js';
export type { ResolveCascaderRootClassListInput } from './cascader/index.js';

export type {
  MentionProps,
  MentionTriggerResult,
  MentionSource,
  MentionFilterFn,
} from './mention/index.js';
export {
  defaultMentionProps,
  detectMentionTrigger,
  detectMultiMentionTrigger,
  resolveMentionRootClassList,
  resolveMentionTextareaClassList,
  resolveMentionDropdownClassList,
  resolveMentionOptionClassList,
  resolveMentionEmptyClassList,
  CHRONIX_MENTION_CSS,
  ensureChronixMentionStyles,
} from './mention/index.js';
export type { ResolveMentionRootClassListInput } from './mention/index.js';

/*
 * Phase 32 (2026-06-05) — Tier C DatePicker / TimePicker / Calendar (3 components).
 * DatePicker (single-date with calendar popup) + TimePicker (hour/minute/second
 * columns) + Calendar (standalone month view). Uses `date-fns` peer-dep for
 * all date math. See `audit/UI_PHASE_32_DATE_TIME_DESIGN.md`.
 */

export type {
  DatePickerProps,
  CalendarGridCell,
  GenerateCalendarGridOptions,
  CalendarViewMonth,
  ResolveDatePickerRootClassListInput,
  ResolveDatePickerTriggerClassListInput,
  ResolveDatePickerDayClassListInput,
} from './date-picker/index.js';
export {
  defaultDatePickerProps,
  generateCalendarGrid,
  formatDateValue,
  parseDateString,
  nextCalendarMonth,
  prevCalendarMonth,
  calendarMonthLabel,
  deriveCalendarViewMonth,
  resolveDatePickerRootClassList,
  resolveDatePickerTriggerClassList,
  resolveDatePickerPanelClassList,
  resolveDatePickerDayClassList,
  resolveDatePickerHeaderClassList,
  resolveDatePickerWeekdayClassList,
  CHRONIX_DATE_PICKER_CSS,
  ensureChronixDatePickerStyles,
} from './date-picker/index.js';

export type {
  TimePickerProps,
  TimeUnits,
  GenerateTimeUnitsOptions,
  ResolveTimePickerRootClassListInput,
  ResolveTimePickerTriggerClassListInput,
  ResolveTimePickerColumnItemClassListInput,
} from './time-picker/index.js';
export {
  defaultTimePickerProps,
  generateTimeUnits,
  findNearestTimeValue,
  formatTimeValue,
  parseTimeString,
  resolveTimePickerRootClassList,
  resolveTimePickerTriggerClassList,
  resolveTimePickerPanelClassList,
  resolveTimePickerColumnClassList,
  resolveTimePickerColumnItemClassList,
  CHRONIX_TIME_PICKER_CSS,
  ensureChronixTimePickerStyles,
} from './time-picker/index.js';

export type { CalendarProps, ResolveCalendarDayClassListInput } from './calendar/index.js';
export {
  defaultCalendarProps,
  resolveCalendarRootClassList,
  resolveCalendarHeaderClassList,
  resolveCalendarDayClassList,
  resolveCalendarWeekdayClassList,
  CHRONIX_CALENDAR_CSS,
  ensureChronixCalendarStyles,
} from './calendar/index.js';

/*
 * Phase 33 (2026-06-05) — Tier C ColorPicker / Transfer / Slider / Pagination
 * (4 components). ColorPicker reuses cx-kit color-picker math. Transfer reuses
 * cx-kit autocomplete filter. Slider reuses cx-kit slider + input-range math.
 * Pagination ships its own ellipsis page computation.
 * See `audit/UI_PHASE_33_COLOR_TRANSFER_SLIDER_PAGINATION_DESIGN.md`.
 */

export type {
  ColorPickerProps,
  ResolveColorPickerRootClassListInput,
  ResolveColorPickerTriggerClassListInput,
  ResolveColorPickerSwatchClassListInput,
} from './color-picker/index.js';
export {
  defaultColorPickerProps,
  resolveColorPickerRootClassList,
  resolveColorPickerTriggerClassList,
  resolveColorPickerPanelClassList,
  resolveColorPickerSquareClassList,
  resolveColorPickerHueStripClassList,
  resolveColorPickerAlphaStripClassList,
  resolveColorPickerSwatchClassList,
  CHRONIX_COLOR_PICKER_CSS,
  ensureChronixColorPickerStyles,
} from './color-picker/index.js';

export type {
  TransferOption,
  TransferProps,
  TransferBulkAction,
  ResolveTransferRootClassListInput,
  ResolveTransferItemClassListInput,
} from './transfer/index.js';
export {
  defaultTransferProps,
  computeTransferLists,
  filterTransferOptions,
  computeTransferBulkValue,
  resolveTransferRootClassList,
  resolveTransferPanelClassList,
  resolveTransferHeaderClassList,
  resolveTransferBodyClassList,
  resolveTransferItemClassList,
  resolveTransferActionsClassList,
  resolveTransferFilterInputClassList,
  CHRONIX_TRANSFER_CSS,
  ensureChronixTransferStyles,
} from './transfer/index.js';

export type {
  SliderMark,
  SliderProps,
  ComputedSliderMark,
  ResolveSliderRootClassListInput,
  ResolveSliderThumbClassListInput,
  ResolveSliderMarkClassListInput,
} from './slider/index.js';
export {
  defaultSliderProps,
  computeSliderMarks,
  resolveSliderRootClassList,
  resolveSliderTrackClassList,
  resolveSliderFillClassList,
  resolveSliderThumbClassList,
  resolveSliderMarksClassList,
  resolveSliderMarkClassList,
  resolveSliderMarkLabelClassList,
  CHRONIX_SLIDER_CSS,
  ensureChronixSliderStyles,
} from './slider/index.js';

export type {
  PaginationProps,
  ResolvePaginationRootClassListInput,
  ResolvePaginationItemClassListInput,
  ResolvePaginationButtonClassListInput,
} from './pagination/index.js';
export {
  defaultPaginationProps,
  computePageCount,
  computePaginationPages,
  resolvePaginationRootClassList,
  resolvePaginationItemClassList,
  resolvePaginationEllipsisClassList,
  resolvePaginationButtonClassList,
  resolvePaginationJumperClassList,
  resolvePaginationSizePickerClassList,
  CHRONIX_PAGINATION_CSS,
  ensureChronixPaginationStyles,
} from './pagination/index.js';

/*
 * Phase 35 (2026-06-05) — Tier C DynamicInput + DynamicTags + NumberAnimation
 * (3 components). DynamicInput: dynamic value list with add/remove rows.
 * DynamicTags: inline tag editor with closable chips + text input.
 * NumberAnimation: animated number with tween + locale-aware formatting.
 */

export type {
  DynamicInputProps,
  ResolveDynamicInputClassListInput,
} from './dynamic-input/index.js';
export {
  defaultDynamicInputProps,
  resolveDynamicInputClassList,
  createDynamicInputItem,
  CHRONIX_DYNAMIC_INPUT_CSS,
  ensureChronixDynamicInputStyles,
} from './dynamic-input/index.js';

export type { DynamicTagsProps, ResolveDynamicTagsClassListInput } from './dynamic-tags/index.js';
export {
  defaultDynamicTagsProps,
  resolveDynamicTagsClassList,
  CHRONIX_DYNAMIC_TAGS_CSS,
  ensureChronixDynamicTagsStyles,
} from './dynamic-tags/index.js';

export type { NumberAnimationProps } from './number-animation/index.js';
export {
  defaultNumberAnimationProps,
  computeNumberAnimationTween,
  formatAnimatedNumber,
  resolveNumberAnimationClassList,
  CHRONIX_NUMBER_ANIMATION_CSS,
  ensureChronixNumberAnimationStyles,
} from './number-animation/index.js';

export type { AnchorItem, AnchorProps } from './anchor/index.js';
export {
  defaultAnchorProps,
  resolveAnchorClassList,
  CHRONIX_ANCHOR_CSS,
  ensureChronixAnchorStyles,
} from './anchor/index.js';

export type { InfiniteScrollProps } from './infinite-scroll/index.js';
export {
  defaultInfiniteScrollProps,
  resolveInfiniteScrollClassList,
  CHRONIX_INFINITE_SCROLL_CSS,
  ensureChronixInfiniteScrollStyles,
} from './infinite-scroll/index.js';

export type { ScrollbarProps } from './scrollbar/index.js';
export {
  defaultScrollbarProps,
  resolveScrollbarClassList,
  CHRONIX_SCROLLBAR_CSS,
  ensureChronixScrollbarStyles,
} from './scrollbar/index.js';

export type { UploadFileStatus, UploadFileInfo, UploadProps } from './upload/index.js';
export {
  defaultUploadProps,
  createUploadFileId,
  resolveUploadClassList,
  resolveUploadFileClassList,
  CHRONIX_UPLOAD_CSS,
  ensureChronixUploadStyles,
} from './upload/index.js';

/*
 * Phase 36 (2026-06-05) — Imperative APIs (4 components).
 * Message + Notification + DiscreteDialog + LoadingBar.
 * All are imperative/programmatic APIs rendered outside the component
 * tree via fixed-position portals. See `audit/UI_PHASE_36_IMPERATIVE_APIS_DESIGN.md`.
 */

export type {
  MessageItem,
  MessagePlacement,
  MessageQueueOptions,
  MessageType,
} from './message/index.js';
export {
  createMessageItemId,
  resolveMessageClassList,
  CHRONIX_MESSAGE_CSS,
  ensureChronixMessageStyles,
} from './message/index.js';
export type { ResolveMessageClassListInput } from './message/index.js';

export type {
  NotificationItem,
  NotificationPlacement,
  NotificationType,
} from './notification/index.js';
export {
  createNotificationItemId,
  resolveNotificationClassList,
  CHRONIX_NOTIFICATION_CSS,
  ensureChronixNotificationStyles,
} from './notification/index.js';
export type { ResolveNotificationClassListInput } from './notification/index.js';

export type { DialogItem, DialogType } from './discrete-dialog/index.js';
export {
  createDialogItemId,
  resolveDiscreteDialogClassList,
  CHRONIX_DISCRETE_DIALOG_CSS,
  ensureChronixDiscreteDialogStyles,
} from './discrete-dialog/index.js';
export type { ResolveDiscreteDialogClassListInput } from './discrete-dialog/index.js';

export type { LoadingBarState } from './loading-bar/index.js';
export {
  resolveLoadingBarClassList,
  CHRONIX_LOADING_BAR_CSS,
  ensureChronixLoadingBarStyles,
} from './loading-bar/index.js';
export type { ResolveLoadingBarClassListInput } from './loading-bar/index.js';
