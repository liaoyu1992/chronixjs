/**
 * @chronixjs/ui-react — React 18 adapter for the chronix-ui core IR.
 *
 * Phase 12 (2026-06-02): package skeleton + first rendering surface —
 *   `<ChronixUIProvider>` + `useUIContext()` (Phase 0.3 Decision A.1 +
 *   B.1 in action — React Context for propagation; hook returns plain
 *   `ChronixUIContext` since React Context already drives reactivity)
 *   + `<ChronixButton>` first Tier A component port, mirroring the
 *   vue3 + vue2 adapters at the consumer surface.
 *
 * Cross-adapter parity is enforced by:
 * - Shared `ButtonProps` IR + `resolveButtonClassList` pure helper
 *   (single source of class names across vue3 / vue2 / react).
 * - Shared `CHRONIX_BUTTON_CSS` + `ensureChronixButtonStyles` injection
 *   (single source of styles in core).
 * - Cross-demo Playwright in `tooling/golden-runner/tests/ui-button-parity.spec.ts`.
 */

export const UI_REACT_PACKAGE_VERSION = '0.1.0-alpha.0';

export {
  ChronixUIProvider,
  UIContext,
  type ChronixUIProviderProps,
} from './providers/chronix-ui-provider.js';
export { useUIContext } from './hooks/use-ui-context.js';
export { ChronixButton, type ChronixButtonProps } from './components/chronix-button.js';
export { ChronixTag, type ChronixTagProps } from './components/chronix-tag.js';
export { ChronixDivider, type ChronixDividerProps } from './components/chronix-divider.js';
export { ChronixBadge, type ChronixBadgeProps } from './components/chronix-badge.js';
export { ChronixAlert, type ChronixAlertProps } from './components/chronix-alert.js';
export { ChronixCard, type ChronixCardProps } from './components/chronix-card.js';
export { ChronixEmpty, type ChronixEmptyProps } from './components/chronix-empty.js';
export { ChronixSpin, type ChronixSpinProps } from './components/chronix-spin.js';
export { ChronixProgress, type ChronixProgressProps } from './components/chronix-progress.js';
export { ChronixSkeleton, type ChronixSkeletonProps } from './components/chronix-skeleton.js';
export { ChronixSpace, type ChronixSpaceProps } from './components/chronix-space.js';
export { ChronixFlex, type ChronixFlexProps } from './components/chronix-flex.js';
export { ChronixGrid, type ChronixGridProps } from './components/chronix-grid.js';
export { ChronixResult, type ChronixResultProps } from './components/chronix-result.js';
export { ChronixStatistic, type ChronixStatisticProps } from './components/chronix-statistic.js';
export { ChronixCountdown, type ChronixCountdownProps } from './components/chronix-countdown.js';
export {
  ChronixPageHeader,
  type ChronixPageHeaderProps,
} from './components/chronix-page-header.js';
export { ChronixBreadcrumb, type ChronixBreadcrumbProps } from './components/chronix-breadcrumb.js';
export { ChronixSteps, type ChronixStepsProps } from './components/chronix-steps.js';
export { ChronixTimeline, type ChronixTimelineProps } from './components/chronix-timeline.js';
export {
  ChronixDescriptions,
  type ChronixDescriptionsProps,
} from './components/chronix-descriptions.js';
export { ChronixList, type ChronixListProps } from './components/chronix-list.js';
export { ChronixWatermark, type ChronixWatermarkProps } from './components/chronix-watermark.js';
export { ChronixQrCode, type ChronixQrCodeProps } from './components/chronix-qrcode.js';
export { ChronixMarquee, type ChronixMarqueeProps } from './components/chronix-marquee.js';
export { ChronixEllipsis, type ChronixEllipsisProps } from './components/chronix-ellipsis.js';
export { ChronixThing, type ChronixThingProps } from './components/chronix-thing.js';
export { ChronixLog, type ChronixLogProps } from './components/chronix-log.js';
export {
  ChronixButtonGroup,
  type ChronixButtonGroupProps,
} from './components/chronix-button-group.js';
export { ChronixElement, type ChronixElementProps } from './components/chronix-element.js';
export { ChronixTypography, type ChronixTypographyProps } from './components/chronix-typography.js';
export { ChronixCode, type ChronixCodeProps } from './components/chronix-code.js';
export {
  ChronixGradientText,
  type ChronixGradientTextProps,
} from './components/chronix-gradient-text.js';
export { ChronixHighlight, type ChronixHighlightProps } from './components/chronix-highlight.js';
export { ChronixAvatar, type ChronixAvatarProps } from './components/chronix-avatar.js';
export {
  ChronixAvatarGroup,
  type ChronixAvatarGroupProps,
} from './components/chronix-avatar-group.js';
export {
  ChronixIconWrapper,
  type ChronixIconWrapperProps,
} from './components/chronix-icon-wrapper.js';
export { ChronixIcon, type ChronixIconProps } from './components/chronix-icon.js';
export { ChronixEquation, type ChronixEquationProps } from './components/chronix-equation.js';
export { ChronixHeatmap, type ChronixHeatmapProps } from './components/chronix-heatmap.js';
export { ChronixInput, type ChronixInputProps } from './components/chronix-input.js';
export { ChronixInputOtp, type ChronixInputOtpProps } from './components/chronix-input-otp.js';
export { ChronixCheckbox, type ChronixCheckboxProps } from './components/chronix-checkbox.js';
export { ChronixRadio, type ChronixRadioProps } from './components/chronix-radio.js';
export {
  ChronixRadioGroup,
  type ChronixRadioGroupProps,
} from './components/chronix-radio-group.js';
export { ChronixSwitch, type ChronixSwitchProps } from './components/chronix-switch.js';
export { ChronixRate, type ChronixRateProps } from './components/chronix-rate.js';
export {
  ChronixInputNumber,
  type ChronixInputNumberProps,
} from './components/chronix-input-number.js';
export {
  ChronixAutoComplete,
  type ChronixAutoCompleteProps,
} from './components/chronix-autocomplete.js';
export { ChronixPopover, type ChronixPopoverProps } from './components/chronix-popover.js';
export { ChronixTooltip, type ChronixTooltipProps } from './components/chronix-tooltip.js';
export { ChronixPopconfirm, type ChronixPopconfirmProps } from './components/chronix-popconfirm.js';
export { ChronixPopSelect, type ChronixPopSelectProps } from './components/chronix-pop-select.js';
export { ChronixModal, type ChronixModalProps } from './components/chronix-modal.js';
export { ChronixDrawer, type ChronixDrawerProps } from './components/chronix-drawer.js';
export { ChronixDropdown, type ChronixDropdownProps } from './components/chronix-dropdown.js';
export { ChronixMenu, type ChronixMenuProps } from './components/chronix-menu.js';
export { ChronixAffix, type ChronixAffixProps } from './components/chronix-affix.js';
export { ChronixBackTop, type ChronixBackTopProps } from './components/chronix-back-top.js';
// Phase 28 (2026-06-04) — Layout family (8 components).
export { ChronixLayout, type ChronixLayoutProps } from './components/chronix-layout.js';
export {
  ChronixLayoutHeader,
  type ChronixLayoutHeaderProps,
} from './components/chronix-layout-header.js';
export {
  ChronixLayoutSider,
  type ChronixLayoutSiderProps,
} from './components/chronix-layout-sider.js';
export {
  ChronixLayoutContent,
  type ChronixLayoutContentProps,
} from './components/chronix-layout-content.js';
export {
  ChronixLayoutFooter,
  type ChronixLayoutFooterProps,
} from './components/chronix-layout-footer.js';
export { ChronixTabs, type ChronixTabsProps } from './components/chronix-tabs.js';
export { ChronixCollapse, type ChronixCollapseProps } from './components/chronix-collapse.js';
export {
  ChronixCollapseTransition,
  type ChronixCollapseTransitionProps,
} from './components/chronix-collapse-transition.js';
export { ChronixSplit, type ChronixSplitProps } from './components/chronix-split.js';
export { ChronixImage, type ChronixImageProps } from './components/chronix-image.js';
export {
  ChronixFloatButton,
  type ChronixFloatButtonProps,
} from './components/chronix-float-button.js';
export {
  ChronixFloatButtonGroup,
  type ChronixFloatButtonGroupProps,
} from './components/chronix-float-button-group.js';
// Phase 29 (2026-06-04) — Tier B remainder (3 components).
export { ChronixCarousel, type ChronixCarouselProps } from './components/chronix-carousel.js';
export { ChronixWave, type ChronixWaveProps } from './components/chronix-wave.js';
export {
  ChronixFocusDetector,
  type ChronixFocusDetectorProps,
} from './components/chronix-focus-detector.js';
export { ChronixTree, type ChronixTreeProps } from './components/chronix-tree.js';
// Phase 31 (2026-06-04) — Tier C Select family (4 components).
export { ChronixSelect, type ChronixSelectProps } from './components/chronix-select.js';
export {
  ChronixTreeSelect,
  type ChronixTreeSelectProps,
} from './components/chronix-tree-select.js';
export { ChronixCascader, type ChronixCascaderProps } from './components/chronix-cascader.js';
export { ChronixMention, type ChronixMentionProps } from './components/chronix-mention.js';
// Phase 32 (2026-06-05) — Tier C DatePicker / TimePicker / Calendar (3 components).
export {
  ChronixDatePicker,
  type ChronixDatePickerProps,
} from './components/chronix-date-picker.js';
export {
  ChronixTimePicker,
  type ChronixTimePickerProps,
} from './components/chronix-time-picker.js';
export { ChronixCalendar, type ChronixCalendarProps } from './components/chronix-calendar.js';
// Phase 33 (2026-06-05) — Tier C ColorPicker / Transfer / Slider / Pagination (4 components).
export {
  ChronixColorPicker,
  type ChronixColorPickerProps,
} from './components/chronix-color-picker.js';
export { ChronixTransfer, type ChronixTransferProps } from './components/chronix-transfer.js';
export { ChronixSlider, type ChronixSliderProps } from './components/chronix-slider.js';
export { ChronixPagination, type ChronixPaginationProps } from './components/chronix-pagination.js';
// Phase 34 (2026-06-05) — Tier C Form (ChronixForm + ChronixFormItem).
export {
  ChronixForm,
  type ChronixFormProps,
  ChronixFormItem,
  type ChronixFormItemProps,
} from './components/chronix-form.js';
// Phase 35 (2026-06-05) — Tier C remainder (7 components).
export {
  ChronixDynamicInput,
  type ChronixDynamicInputProps,
} from './components/chronix-dynamic-input.js';
export {
  ChronixDynamicTags,
  type ChronixDynamicTagsProps,
} from './components/chronix-dynamic-tags.js';
export { ChronixAnchor, type ChronixAnchorProps } from './components/chronix-anchor.js';
export {
  ChronixInfiniteScroll,
  type ChronixInfiniteScrollProps,
} from './components/chronix-infinite-scroll.js';
export {
  ChronixNumberAnimation,
  type ChronixNumberAnimationProps,
} from './components/chronix-number-animation.js';
export { ChronixScrollbar, type ChronixScrollbarProps } from './components/chronix-scrollbar.js';
export { ChronixUpload, type ChronixUploadProps } from './components/chronix-upload.js';
export {
  useModalLifecycle,
  type ModalCloseReason as UseModalLifecycleCloseReason,
} from './hooks/use-modal-lifecycle.js';
// Phase 36 (2026-06-05) — Imperative APIs (4 hooks).
export { useMessage, type MessageApi, type MessageCreateOptions } from './hooks/use-message.js';
export {
  useNotification,
  type NotificationApi,
  type NotificationCreateOptions,
} from './hooks/use-notification.js';
export {
  useDiscreteDialog,
  type DiscreteDialogApi,
  type DialogCreateOptions,
} from './hooks/use-discrete-dialog.js';
export { useLoadingBar, type LoadingBarApi } from './hooks/use-loading-bar.js';
