/**
 * @chronixjs/ui-vue2 — Vue 2.7 adapter for the chronix-ui core IR.
 *
 * Phase 12 (2026-06-02): package skeleton + first rendering surface —
 *   `<ChronixUIProvider>` + `useUIContext()` (Phase 0.3 Decision A.1 +
 *   B.1 in action) + `<ChronixButton>` first Tier A component port,
 *   mirroring the vue3 adapter byte-for-byte at the consumer surface.
 *
 * Cross-adapter parity is enforced by:
 * - Shared `ButtonProps` IR + `resolveButtonClassList` pure helper
 *   (single source of class names across vue3 / vue2 / react).
 * - Shared `CHRONIX_BUTTON_CSS` + `ensureChronixButtonStyles` injection
 *   (single source of styles).
 * - Cross-demo Playwright in `tooling/golden-runner/tests/ui-button-parity.spec.ts`.
 */

export const UI_VUE2_PACKAGE_VERSION = '0.1.0-alpha.0';

export { ChronixUIProvider, UI_CONTEXT_INJECTION_KEY } from './providers/chronix-ui-provider.js';
export { useUIContext } from './composables/use-ui-context.js';
export { ChronixButton } from './components/chronix-button.js';
export { ChronixTag } from './components/chronix-tag.js';
export { ChronixDivider } from './components/chronix-divider.js';
export { ChronixBadge } from './components/chronix-badge.js';
export { ChronixAlert } from './components/chronix-alert.js';
export { ChronixCard } from './components/chronix-card.js';
export { ChronixEmpty } from './components/chronix-empty.js';
export { ChronixSpin } from './components/chronix-spin.js';
export { ChronixProgress } from './components/chronix-progress.js';
export { ChronixSkeleton } from './components/chronix-skeleton.js';
export { ChronixSpace } from './components/chronix-space.js';
export { ChronixFlex } from './components/chronix-flex.js';
export { ChronixGrid } from './components/chronix-grid.js';
export { ChronixResult } from './components/chronix-result.js';
export { ChronixStatistic } from './components/chronix-statistic.js';
export { ChronixCountdown } from './components/chronix-countdown.js';
export { ChronixPageHeader } from './components/chronix-page-header.js';
export { ChronixBreadcrumb } from './components/chronix-breadcrumb.js';
export { ChronixSteps } from './components/chronix-steps.js';
export { ChronixTimeline } from './components/chronix-timeline.js';
export { ChronixDescriptions } from './components/chronix-descriptions.js';
export { ChronixList } from './components/chronix-list.js';
export { ChronixWatermark } from './components/chronix-watermark.js';
export { ChronixQrCode } from './components/chronix-qrcode.js';
export { ChronixMarquee } from './components/chronix-marquee.js';
export { ChronixEllipsis } from './components/chronix-ellipsis.js';
export { ChronixThing } from './components/chronix-thing.js';
export { ChronixLog } from './components/chronix-log.js';
export { ChronixButtonGroup } from './components/chronix-button-group.js';
export { ChronixElement } from './components/chronix-element.js';
export { ChronixTypography } from './components/chronix-typography.js';
export { ChronixCode } from './components/chronix-code.js';
export { ChronixGradientText } from './components/chronix-gradient-text.js';
export { ChronixHighlight } from './components/chronix-highlight.js';
export { ChronixAvatar } from './components/chronix-avatar.js';
export { ChronixAvatarGroup } from './components/chronix-avatar-group.js';
export { ChronixIconWrapper } from './components/chronix-icon-wrapper.js';
export { ChronixIcon } from './components/chronix-icon.js';
export { ChronixEquation } from './components/chronix-equation.js';
export { ChronixHeatmap } from './components/chronix-heatmap.js';
export { ChronixInput } from './components/chronix-input.js';
export { ChronixInputOtp } from './components/chronix-input-otp.js';
export { ChronixCheckbox } from './components/chronix-checkbox.js';
export { ChronixRadio } from './components/chronix-radio.js';
export { ChronixRadioGroup } from './components/chronix-radio-group.js';
export { ChronixSwitch } from './components/chronix-switch.js';
export { ChronixRate } from './components/chronix-rate.js';
export { ChronixInputNumber } from './components/chronix-input-number.js';
export { ChronixAutoComplete } from './components/chronix-autocomplete.js';
export { ChronixPopover } from './components/chronix-popover.js';
export { ChronixTooltip } from './components/chronix-tooltip.js';
export { ChronixPopconfirm } from './components/chronix-popconfirm.js';
export { ChronixPopSelect } from './components/chronix-pop-select.js';
export { ChronixModal } from './components/chronix-modal.js';
export { ChronixDrawer } from './components/chronix-drawer.js';
export { ChronixDropdown } from './components/chronix-dropdown.js';
export { ChronixMenu } from './components/chronix-menu.js';
export { ChronixAffix } from './components/chronix-affix.js';
export { ChronixBackTop } from './components/chronix-back-top.js';
// Phase 28 (2026-06-04) — Layout family (8 components).
export { ChronixLayout } from './components/chronix-layout.js';
export { ChronixLayoutHeader } from './components/chronix-layout-header.js';
export { ChronixLayoutSider } from './components/chronix-layout-sider.js';
export { ChronixLayoutContent } from './components/chronix-layout-content.js';
export { ChronixLayoutFooter } from './components/chronix-layout-footer.js';
export { ChronixTabs } from './components/chronix-tabs.js';
export { ChronixCollapse } from './components/chronix-collapse.js';
export { ChronixCollapseTransition } from './components/chronix-collapse-transition.js';
export { ChronixSplit } from './components/chronix-split.js';
export { ChronixImage } from './components/chronix-image.js';
export { ChronixFloatButton } from './components/chronix-float-button.js';
export { ChronixFloatButtonGroup } from './components/chronix-float-button-group.js';
// Phase 29 (2026-06-04) — Tier B remainder (3 components).
export { ChronixCarousel } from './components/chronix-carousel.js';
export { ChronixWave } from './components/chronix-wave.js';
export { ChronixFocusDetector } from './components/chronix-focus-detector.js';
export { ChronixTree } from './components/chronix-tree.js';
// Phase 31 (2026-06-04) — Tier C Select family (4 components).
export { ChronixSelect } from './components/chronix-select.js';
export { ChronixTreeSelect } from './components/chronix-tree-select.js';
export { ChronixCascader } from './components/chronix-cascader.js';
export { ChronixMention } from './components/chronix-mention.js';
// Phase 32 (2026-06-05) — Tier C DatePicker / TimePicker / Calendar (3 components).
export { ChronixDatePicker } from './components/chronix-date-picker.js';
export { ChronixTimePicker } from './components/chronix-time-picker.js';
export { ChronixCalendar } from './components/chronix-calendar.js';
// Phase 33 (2026-06-05) — Tier C ColorPicker / Transfer / Slider / Pagination (4 components).
export { ChronixColorPicker } from './components/chronix-color-picker.js';
export { ChronixTransfer } from './components/chronix-transfer.js';
export { ChronixSlider } from './components/chronix-slider.js';
export { ChronixPagination } from './components/chronix-pagination.js';
// Phase 34 (2026-06-05) — Tier C Form (ChronixForm + ChronixFormItem).
export { ChronixForm, ChronixFormItem } from './components/chronix-form.js';
// Phase 35 (2026-06-05) — Tier C remainder (7 components).
export { ChronixDynamicInput } from './components/chronix-dynamic-input.js';
export { ChronixDynamicTags } from './components/chronix-dynamic-tags.js';
export { ChronixAnchor } from './components/chronix-anchor.js';
export { ChronixInfiniteScroll } from './components/chronix-infinite-scroll.js';
export { ChronixNumberAnimation } from './components/chronix-number-animation.js';
export { ChronixScrollbar } from './components/chronix-scrollbar.js';
export { ChronixUpload } from './components/chronix-upload.js';
export { useModalLifecycle } from './composables/use-modal-lifecycle.js';
// Phase 36 (2026-06-05) — Imperative APIs (4 composables).
export {
  useMessage,
  type MessageApi,
  type MessageCreateOptions,
} from './composables/use-message.js';
export {
  useNotification,
  type NotificationApi,
  type NotificationCreateOptions,
} from './composables/use-notification.js';
export {
  useDiscreteDialog,
  type DiscreteDialogApi,
  type DialogCreateOptions,
} from './composables/use-discrete-dialog.js';
export { useLoadingBar, type LoadingBarApi } from './composables/use-loading-bar.js';
