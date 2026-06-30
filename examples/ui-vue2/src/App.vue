<script lang="ts">
import type {
  AutoCompleteOption,
  BreadcrumbItem,
  CarouselItem,
  CollapseItem,
  DescriptionItem,
  DropdownOption,
  ListItem,
  MenuItem,
  PopSelectOption,
  RadioOption,
  StepItem,
  TabItem,
  TimelineItem,
  TreeNodeData,
  TreeNodeSpec,
} from '@chronixjs/ui';
import {
  ChronixAffix,
  ChronixAlert,
  ChronixAutoComplete,
  ChronixAvatar,
  ChronixAvatarGroup,
  ChronixBackTop,
  ChronixBadge,
  ChronixBreadcrumb,
  ChronixButton,
  ChronixButtonGroup,
  ChronixCard,
  ChronixCarousel,
  ChronixCheckbox,
  ChronixCode,
  ChronixCollapse,
  ChronixCollapseTransition,
  ChronixCountdown,
  ChronixDescriptions,
  ChronixDivider,
  ChronixDrawer,
  ChronixDropdown,
  ChronixElement,
  ChronixEllipsis,
  ChronixEmpty,
  ChronixEquation,
  ChronixFlex,
  ChronixFloatButton,
  ChronixFloatButtonGroup,
  ChronixFocusDetector,
  ChronixGradientText,
  ChronixGrid,
  ChronixHeatmap,
  ChronixHighlight,
  ChronixIcon,
  ChronixIconWrapper,
  ChronixImage,
  ChronixInput,
  ChronixInputNumber,
  ChronixInputOtp,
  ChronixLayout,
  ChronixLayoutContent,
  ChronixLayoutFooter,
  ChronixLayoutHeader,
  ChronixLayoutSider,
  ChronixList,
  ChronixLog,
  ChronixMarquee,
  ChronixMenu,
  ChronixModal,
  ChronixPageHeader,
  ChronixPopconfirm,
  ChronixPopover,
  ChronixPopSelect,
  ChronixProgress,
  ChronixQrCode,
  ChronixRadioGroup,
  ChronixRate,
  ChronixResult,
  ChronixSkeleton,
  ChronixSpace,
  ChronixSpin,
  ChronixSplit,
  ChronixStatistic,
  ChronixSteps,
  ChronixSwitch,
  ChronixTabs,
  ChronixTag,
  ChronixThing,
  ChronixTimeline,
  ChronixTooltip,
  ChronixTree,
  ChronixTreeSelect,
  ChronixSelect,
  ChronixCascader,
  ChronixMention,
  ChronixDatePicker,
  ChronixTimePicker,
  ChronixCalendar,
  ChronixColorPicker,
  ChronixTransfer,
  ChronixSlider,
  ChronixPagination,
  ChronixForm,
  ChronixFormItem,
  ChronixTypography,
  ChronixUIProvider,
  ChronixWatermark,
  ChronixWave,
  ChronixDynamicInput,
  ChronixDynamicTags,
  ChronixAnchor,
  ChronixInfiniteScroll,
  ChronixNumberAnimation,
  ChronixScrollbar,
  ChronixUpload,
} from '@chronixjs/ui-vue2';
import { defineComponent, ref } from 'vue';

const BREADCRUMB_BASIC_ITEMS: readonly BreadcrumbItem[] = [
  { key: 'home', label: 'Home', href: '/', clickable: false },
  { key: 'docs', label: 'Docs', href: '/docs', clickable: false },
  { key: 'current', label: '', href: undefined, clickable: false },
];

const BREADCRUMB_CLICKABLE_ITEMS: readonly BreadcrumbItem[] = [
  { key: 'spa', label: 'SPA', href: undefined, clickable: true },
  { key: 'last', label: 'Current', href: undefined, clickable: false },
];

const BREADCRUMB_SINGLE_ITEMS: readonly BreadcrumbItem[] = [
  { key: 'only', label: 'Only one', href: undefined, clickable: false },
];

const STEPS_DEFAULT_ITEMS: readonly StepItem[] = [
  { key: 'setup', title: 'Setup', description: undefined, status: undefined },
  { key: 'deploy', title: 'Deploy', description: undefined, status: undefined },
  { key: 'verify', title: 'Verify', description: undefined, status: undefined },
];

const STEPS_WITH_DESCRIPTION_ITEMS: readonly StepItem[] = [
  { key: 'plan', title: 'Plan', description: 'Sketch the design doc', status: undefined },
  { key: 'build', title: 'Build', description: 'Implement + test', status: undefined },
  { key: 'ship', title: 'Ship', description: 'Verify + release', status: undefined },
];

const STEPS_WITH_ERROR_ITEMS: readonly StepItem[] = [
  { key: 'a', title: 'Stage 1', description: undefined, status: undefined },
  { key: 'b', title: 'Stage 2', description: undefined, status: 'error' },
  { key: 'c', title: 'Stage 3', description: undefined, status: undefined },
  { key: 'd', title: 'Stage 4', description: undefined, status: undefined },
];

const TIMELINE_BASIC_ITEMS: readonly TimelineItem[] = [
  {
    key: 'a',
    title: 'Created project',
    description: undefined,
    timestamp: undefined,
    color: 'default',
    lineType: 'default',
  },
  {
    key: 'b',
    title: 'Added README',
    description: undefined,
    timestamp: undefined,
    color: 'default',
    lineType: 'default',
  },
  {
    key: 'c',
    title: 'First release',
    description: undefined,
    timestamp: undefined,
    color: 'default',
    lineType: 'default',
  },
];

const TIMELINE_COLORS_ITEMS: readonly TimelineItem[] = [
  {
    key: 'd',
    title: 'Default note',
    description: undefined,
    timestamp: undefined,
    color: 'default',
    lineType: 'default',
  },
  {
    key: 's',
    title: 'Success milestone',
    description: undefined,
    timestamp: undefined,
    color: 'success',
    lineType: 'default',
  },
  {
    key: 'i',
    title: 'Info update',
    description: undefined,
    timestamp: undefined,
    color: 'info',
    lineType: 'default',
  },
  {
    key: 'w',
    title: 'Warning event',
    description: undefined,
    timestamp: undefined,
    color: 'warning',
    lineType: 'default',
  },
  {
    key: 'e',
    title: 'Error event',
    description: undefined,
    timestamp: undefined,
    color: 'error',
    lineType: 'default',
  },
];

const TIMELINE_TIMESTAMP_ITEMS: readonly TimelineItem[] = [
  {
    key: 'a',
    title: 'Created project',
    description: 'Initial commit on master',
    timestamp: '2026-06-01 09:00',
    color: 'success',
    lineType: 'default',
  },
  {
    key: 'b',
    title: 'Deployed v0.1.0',
    description: 'Pushed to staging',
    timestamp: '2026-06-02 14:30',
    color: 'info',
    lineType: 'default',
  },
  {
    key: 'c',
    title: 'Production release',
    description: undefined,
    timestamp: '2026-06-03 10:15',
    color: 'success',
    lineType: 'default',
  },
];

const TIMELINE_DASHED_ITEMS: readonly TimelineItem[] = [
  {
    key: 'a',
    title: '',
    description: undefined,
    timestamp: undefined,
    color: 'info',
    lineType: 'dashed',
  },
  {
    key: 'b',
    title: '',
    description: undefined,
    timestamp: undefined,
    color: 'info',
    lineType: 'dashed',
  },
  {
    key: 'c',
    title: '',
    description: undefined,
    timestamp: undefined,
    color: 'info',
    lineType: 'dashed',
  },
];

const DESCRIPTIONS_BASIC_ITEMS: readonly DescriptionItem[] = [
  { key: 'name', label: 'Name', value: 'Liao Yu', span: 1 },
  { key: 'email', label: 'Email', value: 'liao@chronix.dev', span: 1 },
  { key: 'role', label: 'Role', value: 'Engineer', span: 1 },
];

const DESCRIPTIONS_SPAN_ITEMS: readonly DescriptionItem[] = [
  { key: 'name', label: 'Name', value: 'Liao Yu', span: 1 },
  { key: 'email', label: 'Email', value: 'liao@chronix.dev', span: 1 },
  { key: 'role', label: 'Role', value: 'Engineer', span: 1 },
  { key: 'bio', label: 'Bio', value: 'Long-form bio that spans 2 columns.', span: 2 },
  { key: 'joined', label: 'Joined', value: '2026-06-03', span: 1 },
];

const LIST_BASIC_ITEMS: readonly ListItem[] = [
  { key: 'docs', title: 'Documents', description: undefined, prefix: undefined, suffix: undefined },
  { key: 'photos', title: 'Photos', description: undefined, prefix: undefined, suffix: undefined },
  { key: 'notes', title: 'Notes', description: undefined, prefix: undefined, suffix: undefined },
];

const LIST_RICH_ITEMS: readonly ListItem[] = [
  {
    key: 'docs',
    title: 'Documents',
    description: '14 items · last edited yesterday',
    prefix: '📁',
    suffix: '→',
  },
  { key: 'photos', title: 'Photos', description: '128 items', prefix: '📷', suffix: 'NEW' },
  { key: 'archive', title: 'Archive', description: 'Read-only', prefix: '🗄', suffix: undefined },
];

const ELLIPSIS_LONG_CONTENT =
  'This is a fairly long sentence that should overflow its container in a single-line context and trigger the text-overflow ellipsis CSS three-piece.';

const LOG_BASIC_LINES: readonly string[] = [
  '$ pnpm install',
  'progress: 1/5 packages installed',
  'progress: 3/5 packages installed',
  'progress: 5/5 packages installed',
  'done in 4.2s',
];

const LOG_LONG_LINES: readonly string[] = Array.from(
  { length: 20 },
  (_, i) => `[${String(i + 1).padStart(2, '0')}] line entry text content for row ${i + 1}`,
);

const AVATAR_GROUP_ITEMS = [
  { key: 'a', src: undefined, text: 'A' },
  { key: 'b', src: undefined, text: 'B' },
  { key: 'c', src: undefined, text: 'C' },
  { key: 'd', src: undefined, text: 'D' },
  { key: 'e', src: undefined, text: 'E' },
  { key: 'f', src: undefined, text: 'F' },
  { key: 'g', src: undefined, text: 'G' },
];

const HEATMAP_CELLS = [
  [1, 5, 8, 3, 9],
  [2, 7, 4, 6, 1],
  [9, 3, 5, 8, 2],
  [4, 6, 7, 1, 5],
];

const PHASE25_RADIO_OPTIONS: readonly RadioOption[] = [
  { key: 'a', label: 'Option A', value: 'a', disabled: false },
  { key: 'b', label: 'Option B', value: 'b', disabled: false },
  { key: 'c', label: 'Option C', value: 'c', disabled: false },
];

const PHASE25_AUTOCOMPLETE_OPTIONS: readonly AutoCompleteOption[] = [
  { key: 'tx', label: 'Texas', value: 'TX' },
  { key: 'tn', label: 'Tennessee', value: 'TN' },
  { key: 'ny', label: 'New York', value: 'NY' },
  { key: 'ca', label: 'California', value: 'CA' },
];

const PHASE26_POP_SELECT_OPTIONS: readonly PopSelectOption[] = [
  { key: 'a', label: 'Action one', value: 'a', disabled: false },
  { key: 'b', label: 'Action two', value: 'b', disabled: false },
  { key: 'c', label: 'Action three (disabled)', value: 'c', disabled: true },
];

const PHASE27_DROPDOWN_OPTIONS: readonly DropdownOption[] = [
  { key: 'edit', label: 'Edit', value: 'edit', disabled: false, icon: undefined },
  { key: 'duplicate', label: 'Duplicate', value: 'duplicate', disabled: false, icon: undefined },
  { key: 'delete', label: 'Delete', value: 'delete', disabled: true, icon: undefined },
];

const PHASE27_MENU_ITEMS: readonly MenuItem[] = [
  {
    key: 'analytics',
    label: 'Analytics',
    icon: undefined,
    disabled: false,
    children: [
      {
        key: 'analytics.dashboard',
        label: 'Dashboard',
        icon: undefined,
        disabled: false,
        children: undefined,
      },
      {
        key: 'analytics.reports',
        label: 'Reports',
        icon: undefined,
        disabled: false,
        children: undefined,
      },
    ],
  },
  { key: 'settings', label: 'Settings', icon: undefined, disabled: false, children: undefined },
];

// Layout family (8 components). Controlled state where
// applicable so Playwright assertions land on content at page load.
const PHASE28_TAB_ITEMS: readonly TabItem[] = [
  { key: 'overview', label: 'Overview', disabled: false, content: 'Overview tab body' },
  { key: 'details', label: 'Details', disabled: false, content: 'Details tab body' },
  { key: 'archived', label: 'Archived', disabled: true, content: 'Archived tab body' },
];
const PHASE28_COLLAPSE_ITEMS: readonly CollapseItem[] = [
  { key: 'a', title: 'Panel A', content: 'Body of panel A.', disabled: false },
  { key: 'b', title: 'Panel B (disabled)', content: 'Cannot expand.', disabled: true },
  { key: 'c', title: 'Panel C', content: 'Body of panel C.', disabled: false },
];

const PHASE29_CAROUSEL_ITEMS: readonly CarouselItem[] = [
  { key: 'a', content: 'Slide A — overview' },
  { key: 'b', content: 'Slide B — details' },
  { key: 'c', content: 'Slide C — summary' },
];

const PHASE30_TREE_ITEMS: readonly TreeNodeSpec<TreeNodeData>[] = [
  {
    key: 'docs',
    data: { label: 'Docs' },
    children: [
      { key: 'docs/intro', data: { label: 'Intro' } },
      { key: 'docs/api', data: { label: 'API' } },
    ],
  },
  {
    key: 'src',
    data: { label: 'Source' },
    children: [
      { key: 'src/index', data: { label: 'index.ts' } },
      { key: 'src/lib', data: { label: 'lib' } },
    ],
  },
  { key: 'readme', data: { label: 'README.md' } },
];

const PHASE30_VIRTUAL_TREE_ITEMS: readonly TreeNodeSpec<TreeNodeData>[] = Array.from(
  { length: 50 },
  (_, i) => ({
    key: `v-${i}`,
    data: { label: `Virtual node ${i}` },
  }),
);

export default defineComponent({
  name: 'App',
  components: {
    ChronixAffix,
    ChronixAlert,
    ChronixAutoComplete,
    ChronixAvatar,
    ChronixAvatarGroup,
    ChronixBackTop,
    ChronixBadge,
    ChronixBreadcrumb,
    ChronixButton,
    ChronixButtonGroup,
    ChronixCard,
    ChronixCarousel,
    ChronixCheckbox,
    ChronixCode,
    ChronixCollapse,
    ChronixCollapseTransition,
    ChronixCountdown,
    ChronixDescriptions,
    ChronixDivider,
    ChronixDrawer,
    ChronixDropdown,
    ChronixElement,
    ChronixEllipsis,
    ChronixEmpty,
    ChronixEquation,
    ChronixFlex,
    ChronixFloatButton,
    ChronixFloatButtonGroup,
    ChronixFocusDetector,
    ChronixGradientText,
    ChronixGrid,
    ChronixHeatmap,
    ChronixHighlight,
    ChronixIcon,
    ChronixIconWrapper,
    ChronixImage,
    ChronixInput,
    ChronixInputNumber,
    ChronixInputOtp,
    ChronixLayout,
    ChronixLayoutContent,
    ChronixLayoutFooter,
    ChronixLayoutHeader,
    ChronixLayoutSider,
    ChronixList,
    ChronixLog,
    ChronixMarquee,
    ChronixMenu,
    ChronixModal,
    ChronixPageHeader,
    ChronixPopconfirm,
    ChronixPopover,
    ChronixPopSelect,
    ChronixProgress,
    ChronixQrCode,
    ChronixRadioGroup,
    ChronixRate,
    ChronixResult,
    ChronixSkeleton,
    ChronixSpace,
    ChronixSpin,
    ChronixSplit,
    ChronixStatistic,
    ChronixSteps,
    ChronixSwitch,
    ChronixTabs,
    ChronixTag,
    ChronixThing,
    ChronixTimeline,
    ChronixTooltip,
    ChronixTree,
    ChronixTreeSelect,
    ChronixSelect,
    ChronixCascader,
    ChronixMention,
    ChronixDatePicker,
    ChronixTimePicker,
    ChronixCalendar,
    ChronixTypography,
    ChronixUIProvider,
    ChronixWatermark,
    ChronixWave,
    ChronixDynamicInput,
    ChronixDynamicTags,
    ChronixAnchor,
    ChronixInfiniteScroll,
    ChronixNumberAnimation,
    ChronixScrollbar,
    ChronixUpload,
    ChronixColorPicker,
    ChronixTransfer,
    ChronixSlider,
    ChronixPagination,
    ChronixForm,
    ChronixFormItem,
  },
  setup() {
    const clickCount = ref(0);
    const blockedClickCount = ref(0);
    const tagCloseCount = ref(0);
    const pageHeaderBackCount = ref(0);
    const breadcrumbClickCount = ref(0);

    // Tier B form input demo state
    const phase25InputText = ref('Hello');
    const phase25InputTextarea = ref('Line 1\nLine 2');
    const phase25InputClearable = ref('Clear me');
    const phase25Otp = ref('12');
    const phase25CheckboxChecked = ref(true);
    const phase25CheckboxIndeterminate = ref(true);
    const phase25RadioValue = ref('a');
    const phase25SwitchChecked = ref(true);
    const phase25Rate = ref(3);
    const phase25RateHalf = ref(2.5);
    const phase25NumberValue = ref<number | null>(10);
    const phase25AutoCompleteValue = ref('');
    const phase26PopSelectValue = ref('a');
    const phase27ModalShow = ref(false);
    const phase27DrawerShow = ref(false);
    const phase28CollapseValue = ref<readonly string[]>(['a']);
    const phase28TabValue = ref<string>('overview');
    const phase29CarouselValue = ref<number>(0);
    const phase30TreeValue = ref<string | undefined>('docs/intro');
    const phase30TreeExpandedKeys = ref<readonly string[]>(['docs']);
    const phase30VirtualTreeValue = ref<string | undefined>(undefined);

    // Select family
    const PHASE31_SELECT_OPTIONS: any[] = [
      { key: 'apple', label: 'Apple', value: 'apple' },
      { key: 'banana', label: 'Banana', value: 'banana' },
      { key: 'cherry', label: 'Cherry', value: 'cherry' },
    ];
    const phase31SelectValue = ref<string | undefined>(undefined);
    const phase31SelectMultiValue = ref<string[]>([]);

    const PHASE31_TREE_DATA: any[] = [
      {
        key: 't1',
        data: { label: 'Tree Node 1' },
        children: [
          { key: 't1-1', data: { label: 'Child 1-1' } },
          { key: 't1-2', data: { label: 'Child 1-2' } },
        ],
      },
      { key: 't2', data: { label: 'Tree Node 2' } },
    ];
    const phase31TreeSelectValue = ref<string | undefined>(undefined);
    const phase31TreeSelectExpandedKeys = ref<string[]>(['t1']);

    const PHASE31_CASCADER_OPTIONS: any[] = [
      {
        key: 'zhejiang',
        label: 'Zhejiang',
        children: [
          { key: 'hangzhou', label: 'Hangzhou', value: 'hangzhou' },
          { key: 'ningbo', label: 'Ningbo', value: 'ningbo' },
        ],
      },
      {
        key: 'jiangsu',
        label: 'Jiangsu',
        children: [{ key: 'nanjing', label: 'Nanjing', value: 'nanjing' }],
      },
    ];
    const phase31CascaderValue = ref<string | undefined>(undefined);

    const PHASE31_MENTION_OPTIONS: any[] = [
      { key: 'alice', label: 'Alice', value: 'alice' },
      { key: 'bob', label: 'Bob', value: 'bob' },
      { key: 'charlie', label: 'Charlie', value: 'charlie' },
    ];
    const phase31MentionValue = ref('');

    // DatePicker / TimePicker / Calendar
    const phase32DatePickerValue = ref<Date | undefined>(undefined);
    const phase32TimePickerValue = ref<Date | undefined>(undefined);
    const phase32CalendarValue = ref<Date | undefined>(undefined);

    // ColorPicker / Transfer / Slider / Pagination
    const phase33ColorPickerValue = ref<string | null>('#4096ff');
    const phase33TransferValue = ref<(string | number)[]>(['a']);
    const phase33SliderValue = ref<number>(50);
    const phase33PaginationPage = ref(1);

    const phase34Model = ref<{ name: string; email: string }>({ name: '', email: '' });
    const phase34Rules = {
      name: { required: true, message: 'Name is required' },
      email: { type: 'email' as const, message: 'Invalid email' },
    };

    // DynamicInput / DynamicTags / Anchor / InfiniteScroll / NumberAnimation / Scrollbar / Upload
    const phase35DynamicInputValue = ref<unknown[]>(['Item 1', 'Item 2']);
    const phase35DynamicTagsValue = ref<string[]>(['Tag 1', 'Tag 2']);
    const phase35NumberAnimationTo = ref(100);
    const phase35UploadFiles = ref([]);

    // Carousel lazy + thumbnails
    const PHASE37_LAZY_CAROUSEL_ITEMS = [
      { key: 'la', content: 'Lazy A', thumbnailLabel: 'A' },
      { key: 'lb', content: 'Lazy B', thumbnailLabel: 'B' },
      { key: 'lc', content: 'Lazy C', thumbnailLabel: 'C' },
      { key: 'ld', content: 'Lazy D', thumbnailLabel: 'D' },
      { key: 'le', content: 'Lazy E', thumbnailLabel: 'E' },
    ];
    const phase37LazyCarouselValue = ref(0);

    // Tabs editable
    const PHASE37_TAB_ITEMS = [
      { key: 'p1', label: 'Tab 1', disabled: false, content: 'Content 1', closable: true },
      { key: 'p2', label: 'Tab 2', disabled: false, content: 'Content 2', closable: true },
      { key: 'p3', label: 'Tab 3', disabled: false, content: 'Content 3', closable: true },
    ];
    const phase37TabsValue = ref('p1');

    // Mention multi-source
    const PHASE37_MENTION_SOURCES = [
      {
        trigger: '@',
        options: [
          { key: 'u1', label: 'Alice', value: 'alice' },
          { key: 'u2', label: 'Bob', value: 'bob' },
        ],
      },
      {
        trigger: '#',
        options: [
          { key: 't1', label: 'urgent', value: 'urgent' },
          { key: 't2', label: 'bug', value: 'bug' },
        ],
      },
    ];
    const phase37MentionValue = ref('');

    function handleClick(): void {
      clickCount.value += 1;
    }

    function handleBlockedClick(): void {
      blockedClickCount.value += 1;
    }

    function handleTagClose(): void {
      tagCloseCount.value += 1;
    }

    function handlePageHeaderBack(): void {
      pageHeaderBackCount.value += 1;
    }

    function handleBreadcrumbItemClick(_item: BreadcrumbItem): void {
      breadcrumbClickCount.value += 1;
    }

    // typed setters for emit handlers (avoids template type mismatch)
    function setPhase31SelectValue(v: unknown): void {
      phase31SelectValue.value = v as string | undefined;
    }
    function setPhase31SelectMultiValue(v: unknown): void {
      phase31SelectMultiValue.value = v as string[];
    }
    function setPhase31TreeSelectValue(v: unknown): void {
      phase31TreeSelectValue.value = v as string | undefined;
    }
    function setPhase31TreeSelectExpandedKeys(v: unknown): void {
      phase31TreeSelectExpandedKeys.value = v as string[];
    }
    function setPhase31CascaderValue(v: unknown): void {
      phase31CascaderValue.value = v as string | undefined;
    }
    // Slider value setter
    function setPhase33SliderValue(v: unknown): void {
      phase33SliderValue.value = v as number;
    }

    return {
      clickCount,
      blockedClickCount,
      tagCloseCount,
      pageHeaderBackCount,
      breadcrumbClickCount,
      handleClick,
      handleBlockedClick,
      handleTagClose,
      handlePageHeaderBack,
      handleBreadcrumbItemClick,
      setPhase31SelectValue,
      setPhase31SelectMultiValue,
      setPhase31TreeSelectValue,
      setPhase31TreeSelectExpandedKeys,
      setPhase31CascaderValue,
      setPhase33SliderValue,
      BREADCRUMB_BASIC_ITEMS,
      BREADCRUMB_CLICKABLE_ITEMS,
      BREADCRUMB_SINGLE_ITEMS,
      STEPS_DEFAULT_ITEMS,
      STEPS_WITH_DESCRIPTION_ITEMS,
      STEPS_WITH_ERROR_ITEMS,
      TIMELINE_BASIC_ITEMS,
      TIMELINE_COLORS_ITEMS,
      TIMELINE_TIMESTAMP_ITEMS,
      TIMELINE_DASHED_ITEMS,
      DESCRIPTIONS_BASIC_ITEMS,
      DESCRIPTIONS_SPAN_ITEMS,
      LIST_BASIC_ITEMS,
      LIST_RICH_ITEMS,
      ELLIPSIS_LONG_CONTENT,
      LOG_BASIC_LINES,
      LOG_LONG_LINES,
      AVATAR_GROUP_ITEMS,
      HEATMAP_CELLS,
      PHASE25_RADIO_OPTIONS,
      PHASE25_AUTOCOMPLETE_OPTIONS,
      PHASE26_POP_SELECT_OPTIONS,
      phase26PopSelectValue,
      phase27ModalShow,
      phase27DrawerShow,
      PHASE27_DROPDOWN_OPTIONS,
      PHASE27_MENU_ITEMS,
      PHASE28_TAB_ITEMS,
      PHASE28_COLLAPSE_ITEMS,
      phase28CollapseValue,
      phase28TabValue,
      PHASE29_CAROUSEL_ITEMS,
      phase29CarouselValue,
      PHASE30_TREE_ITEMS,
      PHASE30_VIRTUAL_TREE_ITEMS,
      phase30TreeValue,
      phase30TreeExpandedKeys,
      phase30VirtualTreeValue,
      phase25InputText,
      phase25InputTextarea,
      phase25InputClearable,
      phase25Otp,
      phase25CheckboxChecked,
      phase25CheckboxIndeterminate,
      phase25RadioValue,
      phase25SwitchChecked,
      phase25Rate,
      phase25RateHalf,
      phase25NumberValue,
      phase25AutoCompleteValue,
      phase32DatePickerValue,
      phase32TimePickerValue,
      phase32CalendarValue,
      PHASE31_SELECT_OPTIONS,
      phase31SelectValue,
      phase31SelectMultiValue,
      PHASE31_TREE_DATA,
      phase31TreeSelectValue,
      phase31TreeSelectExpandedKeys,
      PHASE31_CASCADER_OPTIONS,
      phase31CascaderValue,
      PHASE31_MENTION_OPTIONS,
      phase31MentionValue,
      phase33ColorPickerValue,
      phase33TransferValue,
      phase33SliderValue,
      phase33PaginationPage,
      phase34Model,
      phase34Rules,
      phase35DynamicInputValue,
      phase35DynamicTagsValue,
      phase35NumberAnimationTo,
      phase35UploadFiles,
      PHASE37_LAZY_CAROUSEL_ITEMS,
      phase37LazyCarouselValue,
      PHASE37_TAB_ITEMS,
      phase37TabsValue,
      PHASE37_MENTION_SOURCES,
      phase37MentionValue,
    };
  },
});
</script>

<template>
  <ChronixUIProvider>
    <div class="demo-page" data-testid="demo-page">
      <h1>@chronixjs/ui-vue2 demo</h1>
      <p>Button cross-adapter parity — port 8732.</p>

      <section class="demo-section">
        <h2>Variants</h2>
        <div class="demo-row">
          <ChronixButton data-testid="btn-default" @click="handleClick"> Default </ChronixButton>
          <ChronixButton variant="primary" data-testid="btn-primary" @click="handleClick">
            Primary
          </ChronixButton>
        </div>
      </section>

      <section class="demo-section">
        <h2>Sizes</h2>
        <div class="demo-row">
          <ChronixButton size="small" data-testid="btn-small">Small</ChronixButton>
          <ChronixButton size="medium" data-testid="btn-medium">Medium</ChronixButton>
          <ChronixButton size="large" data-testid="btn-large">Large</ChronixButton>
        </div>
      </section>

      <section class="demo-section">
        <h2>Disabled gate</h2>
        <div class="demo-row">
          <ChronixButton
            variant="primary"
            :disabled="true"
            data-testid="btn-disabled"
            @click="handleBlockedClick"
          >
            Disabled (clicks suppressed)
          </ChronixButton>
        </div>
        <div class="demo-counter">
          Disabled click count:
          <strong data-testid="counter-blocked">{{ blockedClickCount }}</strong>
        </div>
      </section>

      <section class="demo-section">
        <h2>Block (full-width)</h2>
        <ChronixButton variant="primary" :block="true" data-testid="btn-block">
          Block-mode button
        </ChronixButton>
      </section>

      <section class="demo-section">
        <h2>Click counter (verifies event emission)</h2>
        <div class="demo-row">
          <ChronixButton data-testid="btn-increment" @click="handleClick">+1</ChronixButton>
          <ChronixButton variant="primary" data-testid="btn-increment-primary" @click="handleClick">
            +1 (primary)
          </ChronixButton>
        </div>
        <div class="demo-counter">
          Active click count:
          <strong data-testid="counter-active">{{ clickCount }}</strong>
        </div>
      </section>

      <ChronixDivider data-testid="divider-section">Tag + Divider</ChronixDivider>

      <section class="demo-section">
        <h2>Tag types</h2>
        <div class="demo-row">
          <ChronixTag data-testid="tag-default">Default</ChronixTag>
          <ChronixTag type="primary" data-testid="tag-primary">Primary</ChronixTag>
          <ChronixTag type="info" data-testid="tag-info">Info</ChronixTag>
          <ChronixTag type="success" data-testid="tag-success">Success</ChronixTag>
          <ChronixTag type="warning" data-testid="tag-warning">Warning</ChronixTag>
          <ChronixTag type="error" data-testid="tag-error">Error</ChronixTag>
        </div>
      </section>

      <section class="demo-section">
        <h2>Tag sizes + modifiers</h2>
        <div class="demo-row">
          <ChronixTag size="small" data-testid="tag-small">Small</ChronixTag>
          <ChronixTag size="medium" data-testid="tag-medium">Medium</ChronixTag>
          <ChronixTag size="large" data-testid="tag-large">Large</ChronixTag>
          <ChronixTag :round="true" data-testid="tag-round">Round</ChronixTag>
          <ChronixTag
            type="primary"
            :closable="true"
            data-testid="tag-closable"
            @close="handleTagClose"
          >
            Closable
          </ChronixTag>
          <ChronixTag :disabled="true" data-testid="tag-disabled">Disabled</ChronixTag>
        </div>
        <div class="demo-counter">
          Tag close count:
          <strong data-testid="counter-tag-close">{{ tagCloseCount }}</strong>
        </div>
      </section>

      <section class="demo-section">
        <h2>Divider variants</h2>
        <ChronixDivider data-testid="divider-default" />
        <p>Above: default horizontal divider (no title).</p>
        <ChronixDivider titlePlacement="left" data-testid="divider-left">
          Left-aligned
        </ChronixDivider>
        <p>Above: title-left placement.</p>
        <ChronixDivider titlePlacement="right" data-testid="divider-right">
          Right-aligned
        </ChronixDivider>
        <p>Above: title-right placement.</p>
        <ChronixDivider :dashed="true" data-testid="divider-dashed" />
        <p>Above: dashed line.</p>
        <span>Inline text</span>
        <ChronixDivider :vertical="true" data-testid="divider-vertical" />
        <span>after vertical divider</span>
      </section>

      <ChronixDivider data-testid="divider-badge-section">Badge</ChronixDivider>

      <section class="demo-section">
        <h2>Badge standalone (numeric + truncation + string)</h2>
        <div class="demo-row">
          <ChronixBadge :value="5" data-testid="badge-numeric" />
          <ChronixBadge :value="999" :max="99" data-testid="badge-truncated" />
          <ChronixBadge value="NEW" data-testid="badge-string" />
        </div>
      </section>

      <section class="demo-section">
        <h2>Badge types (standalone)</h2>
        <div class="demo-row">
          <ChronixBadge :value="1" type="default" data-testid="badge-type-default" />
          <ChronixBadge :value="2" type="success" data-testid="badge-type-success" />
          <ChronixBadge :value="3" type="warning" data-testid="badge-type-warning" />
          <ChronixBadge :value="4" type="error" data-testid="badge-type-error" />
          <ChronixBadge :value="5" type="info" data-testid="badge-type-info" />
        </div>
      </section>

      <section class="demo-section">
        <h2>Badge modifiers (dot / processing / hidden)</h2>
        <div class="demo-row">
          <ChronixBadge :dot="true" type="success" data-testid="badge-dot" />
          <ChronixBadge
            :dot="true"
            :processing="true"
            type="warning"
            data-testid="badge-processing"
          />
          <ChronixBadge :value="42" :show="false" data-testid="badge-hidden" />
        </div>
      </section>

      <section class="demo-section">
        <h2>Badge wrapping a child</h2>
        <div class="demo-row" style="gap: 32px">
          <ChronixBadge :value="3" data-testid="badge-wrapping-numeric">
            <ChronixButton>Inbox</ChronixButton>
          </ChronixBadge>
          <ChronixBadge :dot="true" type="success" data-testid="badge-wrapping-dot">
            <ChronixButton variant="primary">Online</ChronixButton>
          </ChronixBadge>
          <ChronixBadge :value="200" :max="99" type="error" data-testid="badge-wrapping-trunc">
            <ChronixButton>Errors</ChronixButton>
          </ChronixBadge>
        </div>
      </section>

      <ChronixDivider data-testid="divider-info-section"> Alert + Card + Empty </ChronixDivider>

      <section class="demo-section">
        <h2>Alert types</h2>
        <ChronixAlert type="default" title="Default" data-testid="alert-default">
          Default alert message.
        </ChronixAlert>
        <div style="height: 8px"></div>
        <ChronixAlert type="info" title="Info" data-testid="alert-info">
          Informational message.
        </ChronixAlert>
        <div style="height: 8px"></div>
        <ChronixAlert type="success" title="Success" data-testid="alert-success">
          Success message.
        </ChronixAlert>
        <div style="height: 8px"></div>
        <ChronixAlert type="warning" title="Warning" data-testid="alert-warning">
          Warning message.
        </ChronixAlert>
        <div style="height: 8px"></div>
        <ChronixAlert type="error" title="Error" data-testid="alert-error">
          Error message.
        </ChronixAlert>
        <div style="height: 8px"></div>
        <ChronixAlert type="info" :closable="true" data-testid="alert-closable">
          Closable alert (no title).
        </ChronixAlert>
      </section>

      <section class="demo-section">
        <h2>Card variants</h2>
        <div class="demo-row" style="align-items: flex-start; flex-wrap: wrap; gap: 16px">
          <ChronixCard title="Basic" data-testid="card-basic" style="flex: 1; min-width: 240px">
            Default card with title + body.
          </ChronixCard>
          <ChronixCard
            title="With footer"
            data-testid="card-with-footer"
            style="flex: 1; min-width: 240px"
          >
            Body content here.
            <template #footer>
              <ChronixButton size="small">OK</ChronixButton>
            </template>
          </ChronixCard>
          <ChronixCard
            size="small"
            :hoverable="true"
            data-testid="card-hoverable"
            style="flex: 1; min-width: 240px"
          >
            Small + hoverable card (no title).
          </ChronixCard>
        </div>
        <div style="height: 16px"></div>
        <ChronixCard :embedded="true" title="Embedded" data-testid="card-embedded">
          Embedded variant — flat blends with background.
        </ChronixCard>
      </section>

      <section class="demo-section">
        <h2>Empty states</h2>
        <div class="demo-row" style="align-items: flex-start; gap: 32px">
          <ChronixEmpty data-testid="empty-default" />
          <ChronixEmpty size="small" description="Small empty" data-testid="empty-small" />
          <ChronixEmpty data-testid="empty-with-action">
            <ChronixButton variant="primary" size="small">Add row</ChronixButton>
          </ChronixEmpty>
        </div>
      </section>

      <ChronixDivider data-testid="divider-loading-section">
        Loading states (Spin + Progress + Skeleton)
      </ChronixDivider>

      <section class="demo-section">
        <h2>Spin sizes + description + hidden</h2>
        <div class="demo-row" style="gap: 32px; align-items: flex-start">
          <ChronixSpin data-testid="spin-default" />
          <ChronixSpin description="Loading data" data-testid="spin-with-desc" />
          <ChronixSpin size="small" description="Small" data-testid="spin-small" />
          <ChronixSpin size="large" data-testid="spin-large" />
          <ChronixSpin :show="false" data-testid="spin-hidden" />
        </div>
      </section>

      <section class="demo-section">
        <h2>Progress types + placements + custom height</h2>
        <div style="display: flex; flex-direction: column; gap: 12px; max-width: 360px">
          <ChronixProgress :percentage="42" data-testid="progress-default" />
          <ChronixProgress type="success" :percentage="80" data-testid="progress-success" />
          <ChronixProgress type="warning" :percentage="55" data-testid="progress-warning" />
          <ChronixProgress type="error" :percentage="12" data-testid="progress-error" />
          <ChronixProgress type="info" :percentage="33" data-testid="progress-info" />
          <ChronixProgress
            :percentage="60"
            indicatorPlacement="inside"
            :height="18"
            data-testid="progress-inside"
          />
          <ChronixProgress :percentage="70" :showInfo="false" data-testid="progress-no-info" />
          <ChronixProgress :percentage="88" :height="14" data-testid="progress-tall" />
        </div>
      </section>

      <section class="demo-section">
        <h2>Skeleton shapes + sizing + modifiers</h2>
        <div style="display: flex; flex-direction: column; gap: 8px; max-width: 360px">
          <ChronixSkeleton data-testid="skeleton-text" />
          <ChronixSkeleton :width="200" :height="60" shape="rect" data-testid="skeleton-rect" />
          <div style="display: flex; gap: 12px; align-items: center">
            <ChronixSkeleton shape="circle" data-testid="skeleton-circle" />
            <ChronixSkeleton :animated="false" :width="160" data-testid="skeleton-static" />
            <ChronixSkeleton :round="true" :width="120" :height="12" data-testid="skeleton-round" />
          </div>
        </div>
      </section>

      <ChronixDivider data-testid="divider-layout-section">
        Layout primitives (Space + Flex + Grid)
      </ChronixDivider>

      <section class="demo-section">
        <h2>Space — token + numeric size, vertical, justify</h2>
        <ChronixSpace data-testid="space-default">
          <ChronixTag>A</ChronixTag><ChronixTag>B</ChronixTag><ChronixTag>C</ChronixTag>
        </ChronixSpace>
        <div style="height: 16px"></div>
        <ChronixSpace :vertical="true" data-testid="space-vertical">
          <ChronixTag>1</ChronixTag><ChronixTag>2</ChronixTag><ChronixTag>3</ChronixTag>
        </ChronixSpace>
        <div style="height: 16px"></div>
        <ChronixSpace size="large" data-testid="space-large">
          <ChronixTag>X</ChronixTag><ChronixTag>Y</ChronixTag><ChronixTag>Z</ChronixTag>
        </ChronixSpace>
        <div style="height: 16px"></div>
        <ChronixSpace :size="20" data-testid="space-numeric">
          <ChronixTag>P</ChronixTag><ChronixTag>Q</ChronixTag><ChronixTag>R</ChronixTag>
        </ChronixSpace>
        <div style="height: 16px"></div>
        <ChronixSpace
          justify="space-between"
          data-testid="space-justify-between"
          style="width: 320px"
        >
          <ChronixTag>left</ChronixTag>
          <ChronixTag>right</ChronixTag>
        </ChronixSpace>
      </section>

      <section class="demo-section">
        <h2>Flex — direction, wrap, gap, align/justify</h2>
        <ChronixFlex data-testid="flex-default">
          <ChronixTag>row1</ChronixTag><ChronixTag>row2</ChronixTag>
        </ChronixFlex>
        <div style="height: 16px"></div>
        <ChronixFlex direction="column" data-testid="flex-column">
          <ChronixTag>col1</ChronixTag><ChronixTag>col2</ChronixTag>
        </ChronixFlex>
        <div style="height: 16px"></div>
        <ChronixFlex wrap="wrap-reverse" data-testid="flex-wrap-reverse" style="max-width: 200px">
          <ChronixTag>a</ChronixTag><ChronixTag>b</ChronixTag><ChronixTag>c</ChronixTag
          ><ChronixTag>d</ChronixTag>
        </ChronixFlex>
        <div style="height: 16px"></div>
        <ChronixFlex gap="medium" data-testid="flex-gap-token">
          <ChronixTag>m1</ChronixTag><ChronixTag>m2</ChronixTag>
        </ChronixFlex>
        <div style="height: 16px"></div>
        <ChronixFlex :gap="16" data-testid="flex-gap-numeric">
          <ChronixTag>n1</ChronixTag><ChronixTag>n2</ChronixTag>
        </ChronixFlex>
        <div style="height: 16px"></div>
        <ChronixFlex
          align="center"
          justify="center"
          :gap="8"
          data-testid="flex-center"
          style="height: 80px; border: 1px dashed #ccc"
        >
          <ChronixTag>centered</ChronixTag>
        </ChronixFlex>
      </section>

      <section class="demo-section">
        <h2>Grid — uniform N cols, custom track, inline</h2>
        <ChronixGrid :cols="3" :xGap="8" :yGap="8" data-testid="grid-3col">
          <ChronixCard size="small" title="A">A</ChronixCard>
          <ChronixCard size="small" title="B">B</ChronixCard>
          <ChronixCard size="small" title="C">C</ChronixCard>
        </ChronixGrid>
        <div style="height: 16px"></div>
        <ChronixGrid :cols="12" :xGap="4" :yGap="4" data-testid="grid-12col">
          <ChronixTag>1</ChronixTag><ChronixTag>2</ChronixTag><ChronixTag>3</ChronixTag
          ><ChronixTag>4</ChronixTag> <ChronixTag>5</ChronixTag><ChronixTag>6</ChronixTag
          ><ChronixTag>7</ChronixTag><ChronixTag>8</ChronixTag>
        </ChronixGrid>
        <div style="height: 16px"></div>
        <ChronixGrid cols="120px 1fr 120px" :xGap="12" data-testid="grid-custom">
          <ChronixTag>L</ChronixTag>
          <ChronixTag>fluid mid</ChronixTag>
          <ChronixTag>R</ChronixTag>
        </ChronixGrid>
        <div style="height: 16px"></div>
        <ChronixGrid :inline="true" :cols="2" :xGap="8" data-testid="grid-inline">
          <ChronixTag>il-a</ChronixTag><ChronixTag>il-b</ChronixTag>
        </ChronixGrid>
      </section>

      <ChronixDivider data-testid="divider-status-numeric-section">
        Result + Statistic + Countdown
      </ChronixDivider>

      <section class="demo-section">
        <h2>Result — semantic + HTTP statuses</h2>
        <div class="demo-row" style="align-items: flex-start; gap: 24px; flex-wrap: wrap">
          <ChronixResult
            title="Heads up"
            description="Default info."
            data-testid="result-default"
          />
          <ChronixResult
            status="success"
            title="Done"
            description="Saved successfully."
            data-testid="result-success"
          />
          <ChronixResult
            status="error"
            title="Failed"
            description="Something went wrong."
            data-testid="result-error"
          />
          <ChronixResult
            status="404"
            title="Page not found"
            description="The page you requested does not exist."
            data-testid="result-404"
          />
          <ChronixResult status="success" title="All set" data-testid="result-with-extra">
            <ChronixButton variant="primary" size="small">Continue</ChronixButton>
          </ChronixResult>
        </div>
      </section>

      <section class="demo-section">
        <h2>Statistic — label / value / precision / prefix / suffix</h2>
        <div class="demo-row" style="gap: 32px; flex-wrap: wrap">
          <ChronixStatistic label="Users" :value="1234" data-testid="stat-basic" />
          <ChronixStatistic
            label="Conversion"
            :value="0.4267"
            :precision="2"
            data-testid="stat-precision"
          />
          <ChronixStatistic
            label="Revenue"
            :value="1234.5"
            :precision="2"
            data-testid="stat-prefix"
          >
            <template #prefix>$</template>
          </ChronixStatistic>
          <ChronixStatistic label="Bandwidth" :value="42" data-testid="stat-suffix">
            <template #suffix>GB</template>
          </ChronixStatistic>
          <ChronixStatistic label="Missing" data-testid="stat-placeholder" />
        </div>
      </section>

      <section class="demo-section">
        <h2>Countdown — precision + paused</h2>
        <div class="demo-row" style="gap: 32px; flex-wrap: wrap">
          <ChronixCountdown :duration="3600000" :active="false" data-testid="countdown-basic" />
          <ChronixCountdown
            :duration="3600000"
            :precision="2"
            :active="false"
            data-testid="countdown-precise"
          />
          <ChronixCountdown
            label="Sale ends in"
            :duration="86400000"
            :active="false"
            data-testid="countdown-with-label"
          />
        </div>
      </section>

      <ChronixDivider data-testid="divider-info-arch-section">
        Information architecture (PageHeader + Breadcrumb)
      </ChronixDivider>

      <section class="demo-section">
        <h2>PageHeader — title / subtitle / back / inverted / extra / full</h2>
        <div style="display: flex; flex-direction: column; gap: 16px">
          <ChronixPageHeader
            title="Project A"
            subtitle="Owned by you"
            data-testid="page-header-default"
          />
          <ChronixPageHeader
            title="Project A"
            subtitle="Owned by you"
            :back="true"
            data-testid="page-header-with-back"
            @back="handlePageHeaderBack"
          />
          <ChronixPageHeader
            title="Inverted header"
            subtitle="Dark surface"
            :inverted="true"
            data-testid="page-header-inverted"
          />
          <ChronixPageHeader
            title="With extra"
            subtitle="Action area on the right"
            data-testid="page-header-with-extra"
          >
            <template #extra>
              <ChronixButton size="small">Cancel</ChronixButton>
              <ChronixButton variant="primary" size="small">Save</ChronixButton>
            </template>
          </ChronixPageHeader>
          <ChronixPageHeader
            title="Fully populated"
            subtitle="back + avatar + extra + footer + content"
            :back="true"
            data-testid="page-header-full"
            @back="handlePageHeaderBack"
          >
            <template #avatar>
              <ChronixBadge :dot="true" type="success">
                <ChronixTag type="info">A</ChronixTag>
              </ChronixBadge>
            </template>
            <template #extra>
              <ChronixButton variant="primary" size="small">Save</ChronixButton>
            </template>
            <template #footer>
              <span>Tabs: Overview / Details / History</span>
            </template>
            Body content rendered between heading and footer.
          </ChronixPageHeader>
        </div>
        <div class="demo-counter">
          Page header back click count:
          <strong data-testid="counter-page-header-back">{{ pageHeaderBackCount }}</strong>
        </div>
      </section>

      <section class="demo-section">
        <h2>Breadcrumb — basic / custom separator / clickable / single</h2>
        <div style="display: flex; flex-direction: column; gap: 12px; align-items: flex-start">
          <ChronixBreadcrumb
            :items="BREADCRUMB_BASIC_ITEMS"
            data-testid="breadcrumb-basic"
            @item-click="handleBreadcrumbItemClick"
          />
          <ChronixBreadcrumb
            :items="BREADCRUMB_BASIC_ITEMS"
            separator=">"
            data-testid="breadcrumb-custom-sep"
            @item-click="handleBreadcrumbItemClick"
          />
          <ChronixBreadcrumb
            :items="BREADCRUMB_CLICKABLE_ITEMS"
            data-testid="breadcrumb-clickable"
            @item-click="handleBreadcrumbItemClick"
          />
          <ChronixBreadcrumb
            :items="BREADCRUMB_SINGLE_ITEMS"
            data-testid="breadcrumb-single"
            @item-click="handleBreadcrumbItemClick"
          />
        </div>
        <div class="demo-counter">
          Breadcrumb item click count:
          <strong data-testid="counter-breadcrumb-click">{{ breadcrumbClickCount }}</strong>
        </div>
      </section>

      <ChronixDivider data-testid="divider-process-timeline-section">
        Steps + Timeline
      </ChronixDivider>

      <section class="demo-section">
        <h2>Steps — horizontal / vertical / with-error / all-done / with-description</h2>
        <div style="display: flex; flex-direction: column; gap: 24px">
          <ChronixSteps :items="STEPS_DEFAULT_ITEMS" :current="1" data-testid="steps-default" />
          <ChronixSteps
            :items="STEPS_DEFAULT_ITEMS"
            direction="vertical"
            :current="0"
            data-testid="steps-vertical"
          />
          <ChronixSteps
            :items="STEPS_WITH_ERROR_ITEMS"
            :current="2"
            data-testid="steps-with-error"
          />
          <ChronixSteps :items="STEPS_DEFAULT_ITEMS" :current="3" data-testid="steps-all-done" />
          <ChronixSteps
            :items="STEPS_WITH_DESCRIPTION_ITEMS"
            :current="1"
            data-testid="steps-with-description"
          />
        </div>
      </section>

      <section class="demo-section">
        <h2>Timeline — basic / colors / with-timestamp / dashed</h2>
        <div
          style="
            display: flex;
            flex-direction: row;
            gap: 32px;
            flex-wrap: wrap;
            align-items: flex-start;
          "
        >
          <ChronixTimeline :items="TIMELINE_BASIC_ITEMS" data-testid="timeline-basic" />
          <ChronixTimeline :items="TIMELINE_COLORS_ITEMS" data-testid="timeline-colors" />
          <ChronixTimeline
            :items="TIMELINE_TIMESTAMP_ITEMS"
            data-testid="timeline-with-timestamp"
          />
          <ChronixTimeline :items="TIMELINE_DASHED_ITEMS" data-testid="timeline-dashed" />
        </div>
      </section>

      <ChronixDivider data-testid="divider-data-display-section">
        Data display (Descriptions + List)
      </ChronixDivider>

      <section class="demo-section">
        <h2>Descriptions — default / bordered / vertical / span / title / small</h2>
        <div style="display: flex; flex-direction: column; gap: 24px">
          <ChronixDescriptions
            :items="DESCRIPTIONS_BASIC_ITEMS"
            :columns="3"
            data-testid="descriptions-default"
          />
          <ChronixDescriptions
            :items="DESCRIPTIONS_BASIC_ITEMS"
            :columns="3"
            :bordered="true"
            data-testid="descriptions-bordered"
          />
          <ChronixDescriptions
            :items="DESCRIPTIONS_BASIC_ITEMS"
            :columns="3"
            labelPlacement="top"
            data-testid="descriptions-vertical"
          />
          <ChronixDescriptions
            :items="DESCRIPTIONS_SPAN_ITEMS"
            :columns="3"
            data-testid="descriptions-with-span"
          />
          <ChronixDescriptions
            :items="DESCRIPTIONS_BASIC_ITEMS"
            :columns="3"
            title="Profile"
            data-testid="descriptions-with-title"
          />
          <ChronixDescriptions
            :items="DESCRIPTIONS_BASIC_ITEMS"
            :columns="3"
            size="small"
            data-testid="descriptions-small"
          />
        </div>
      </section>

      <section class="demo-section">
        <h2>List — basic / bordered+hoverable / no-divider / prefix+suffix / small</h2>
        <div style="display: flex; flex-direction: column; gap: 24px; max-width: 480px">
          <ChronixList :items="LIST_BASIC_ITEMS" data-testid="list-basic" />
          <ChronixList
            :items="LIST_BASIC_ITEMS"
            :bordered="true"
            :hoverable="true"
            data-testid="list-bordered-hoverable"
          />
          <ChronixList
            :items="LIST_BASIC_ITEMS"
            :showDivider="false"
            data-testid="list-no-divider"
          />
          <ChronixList
            :items="LIST_RICH_ITEMS"
            :bordered="true"
            data-testid="list-with-prefix-suffix"
          />
          <ChronixList :items="LIST_BASIC_ITEMS" size="small" data-testid="list-small" />
        </div>
      </section>

      <ChronixDivider data-testid="divider-visual-artifacts-section">
        Visual artifacts (Watermark + QrCode + Marquee)
      </ChronixDivider>

      <section class="demo-section">
        <h2>Watermark — default / rotated / large tile</h2>
        <div style="display: flex; flex-direction: column; gap: 24px">
          <ChronixWatermark data-testid="watermark-default">
            <div style="padding: 32px; background: #fafafa; min-height: 120px">
              Default watermark wrapping arbitrary content.
            </div>
          </ChronixWatermark>
          <ChronixWatermark
            content="DRAFT"
            :rotate="-30"
            :opacity="0.25"
            color="#d03050"
            data-testid="watermark-rotated"
          >
            <div style="padding: 32px; background: #fff; min-height: 120px">
              -30° red DRAFT watermark.
            </div>
          </ChronixWatermark>
          <ChronixWatermark
            content="CONFIDENTIAL"
            :width="320"
            :height="120"
            :fontSize="22"
            data-testid="watermark-large"
          >
            <div style="padding: 32px; background: #fafafa; min-height: 160px">
              Large 320×120 tile.
            </div>
          </ChronixWatermark>
        </div>
      </section>

      <section class="demo-section">
        <h2>QrCode — default / low EC / colored / large</h2>
        <div class="demo-row" style="gap: 24px; flex-wrap: wrap; align-items: flex-start">
          <ChronixQrCode value="https://chronix.dev" data-testid="qrcode-default" />
          <ChronixQrCode value="hello" errorCorrectionLevel="L" data-testid="qrcode-low-ec" />
          <ChronixQrCode
            value="chronix"
            foreground="#18a058"
            background="#f0fdf4"
            data-testid="qrcode-colored"
          />
          <ChronixQrCode
            value="https://chronix.dev/v0.1.0"
            :size="256"
            data-testid="qrcode-large"
          />
        </div>
      </section>

      <section class="demo-section">
        <h2>Marquee — left / right / up / pause-on-hover</h2>
        <div style="display: flex; flex-direction: column; gap: 16px">
          <ChronixMarquee data-testid="marquee-default">
            <span style="padding: 0 32px">⭐ BTC $50,000</span>
            <span style="padding: 0 32px">📈 ETH $3,000</span>
            <span style="padding: 0 32px">💎 SOL $150</span>
            <span style="padding: 0 32px">🚀 DOT $20</span>
          </ChronixMarquee>
          <ChronixMarquee direction="right" data-testid="marquee-right">
            <span style="padding: 0 24px">→ news headline 1</span>
            <span style="padding: 0 24px">→ news headline 2</span>
            <span style="padding: 0 24px">→ news headline 3</span>
          </ChronixMarquee>
          <div style="height: 120px; display: flex; align-items: stretch; gap: 16px">
            <ChronixMarquee direction="up" data-testid="marquee-up" style="flex: 1">
              <div style="padding: 8px 16px">tick 1</div>
              <div style="padding: 8px 16px">tick 2</div>
              <div style="padding: 8px 16px">tick 3</div>
              <div style="padding: 8px 16px">tick 4</div>
            </ChronixMarquee>
          </div>
          <ChronixMarquee :pauseOnHover="true" data-testid="marquee-pause-on-hover">
            <span style="padding: 0 32px">hover me to pause #1</span>
            <span style="padding: 0 32px">hover me to pause #2</span>
            <span style="padding: 0 32px">hover me to pause #3</span>
          </ChronixMarquee>
        </div>
      </section>

      <ChronixDivider data-testid="divider-info-density-section">
        Information density (Ellipsis + Thing + Log)
      </ChronixDivider>

      <section class="demo-section">
        <h2>Ellipsis — single / multi-line / no-tooltip</h2>
        <div style="display: flex; flex-direction: column; gap: 16px; max-width: 360px">
          <ChronixEllipsis :content="ELLIPSIS_LONG_CONTENT" data-testid="ellipsis-single" />
          <ChronixEllipsis
            :content="ELLIPSIS_LONG_CONTENT"
            :lineClamp="2"
            data-testid="ellipsis-multi-line"
          />
          <ChronixEllipsis
            :content="ELLIPSIS_LONG_CONTENT"
            :tooltip="false"
            data-testid="ellipsis-no-tooltip"
          />
        </div>
      </section>

      <section class="demo-section">
        <h2>Thing — basic / avatar / full / indented</h2>
        <div style="display: flex; flex-direction: column; gap: 16px; max-width: 480px">
          <ChronixThing
            title="Project A"
            description="A short summary of the project status."
            data-testid="thing-basic"
          >
            <p>Body content describing the project in more detail.</p>
          </ChronixThing>
          <ChronixThing title="With avatar" description="Sub-text" data-testid="thing-with-avatar">
            <template #avatar>
              <span style="font-size: 28px">👤</span>
            </template>
          </ChronixThing>
          <ChronixThing
            title="Notification"
            description="A multi-slot card with every slot populated."
            data-testid="thing-full"
          >
            <template #avatar>
              <span style="font-size: 28px">🔔</span>
            </template>
            <template #header-extra>
              <small>2m ago</small>
            </template>
            <p>This is the body content. It spans the full width of the main column.</p>
            <template #action>
              <ChronixButton variant="primary">Reply</ChronixButton>
              <ChronixButton>Dismiss</ChronixButton>
            </template>
            <template #footer> From: alice@chronix.dev </template>
          </ChronixThing>
          <ChronixThing
            title="Indented content"
            description="Avatar with indented body"
            :contentIndented="true"
            data-testid="thing-indented"
          >
            <template #avatar>
              <span style="font-size: 28px">📝</span>
            </template>
            <p>Body content aligns past the avatar column.</p>
          </ChronixThing>
        </div>
      </section>

      <section class="demo-section">
        <h2>Log — basic / line-numbers / loading / max-height</h2>
        <div style="display: flex; flex-direction: column; gap: 16px; max-width: 560px">
          <ChronixLog :lines="LOG_BASIC_LINES" data-testid="log-basic" />
          <ChronixLog
            :lines="LOG_BASIC_LINES"
            :lineNumbers="true"
            data-testid="log-with-line-numbers"
          />
          <ChronixLog :lines="LOG_BASIC_LINES" :loading="true" data-testid="log-loading" />
          <ChronixLog
            :lines="LOG_LONG_LINES"
            :lineNumbers="true"
            :maxHeight="200"
            data-testid="log-max-height"
          />
        </div>
      </section>

      <ChronixDivider data-testid="divider-tier-a-finale-section">
        Tier A finale (12 components)
      </ChronixDivider>

      <section class="demo-section">
        <h2>ButtonGroup / Element / Typography / Code</h2>
        <div style="display: flex; flex-direction: column; gap: 16px">
          <ChronixButtonGroup data-testid="phase24-button-group">
            <ChronixButton>One</ChronixButton>
            <ChronixButton>Two</ChronixButton>
            <ChronixButton>Three</ChronixButton>
          </ChronixButtonGroup>
          <ChronixElement tag="section" data-testid="phase24-element">
            Element as &lt;section&gt;
          </ChronixElement>
          <ChronixTypography variant="title" :level="3" data-testid="phase24-typography">
            Typography h3 title
          </ChronixTypography>
          <ChronixCode value="const x = 1 + 2;&#10;console.log(x);" data-testid="phase24-code" />
        </div>
      </section>

      <section class="demo-section">
        <h2>GradientText / Highlight</h2>
        <div style="display: flex; flex-direction: column; gap: 16px">
          <ChronixGradientText value="Rainbow gradient text" data-testid="phase24-gradient-text" />
          <ChronixHighlight
            value="The quick brown fox jumps over the lazy dog"
            pattern="quick"
            data-testid="phase24-highlight"
          />
        </div>
      </section>

      <section class="demo-section">
        <h2>Avatar / AvatarGroup / IconWrapper / Icon</h2>
        <div
          style="
            display: flex;
            flex-direction: row;
            gap: 24px;
            align-items: center;
            flex-wrap: wrap;
          "
        >
          <ChronixAvatar text="AB" data-testid="phase24-avatar" />
          <ChronixAvatarGroup
            :items="AVATAR_GROUP_ITEMS"
            :max="5"
            data-testid="phase24-avatar-group"
          />
          <ChronixIconWrapper :size="32" color="#3b82f6" data-testid="phase24-icon-wrapper">
            <ChronixIcon name="check" :size="32" />
          </ChronixIconWrapper>
          <ChronixIcon name="check" :size="24" data-testid="phase24-icon" />
        </div>
      </section>

      <section class="demo-section">
        <h2>Equation / Heatmap</h2>
        <div
          style="
            display: flex;
            flex-direction: row;
            gap: 32px;
            align-items: flex-start;
            flex-wrap: wrap;
          "
        >
          <ChronixEquation
            value="<mrow><mi>E</mi><mo>=</mo><mi>m</mi><msup><mi>c</mi><mn>2</mn></msup></mrow>"
            display="block"
            data-testid="phase24-equation"
          />
          <ChronixHeatmap :cells="HEATMAP_CELLS" :cellSize="24" data-testid="phase24-heatmap" />
        </div>
      </section>

      <ChronixDivider data-testid="divider-tier-b-form-inputs-section">
        Tier B form inputs (8 components)
      </ChronixDivider>

      <section class="demo-section">
        <h2>Input + InputOtp</h2>
        <div style="display: flex; flex-direction: column; gap: 12px; max-width: 360px">
          <ChronixInput
            :value="phase25InputText"
            placeholder="Type something"
            data-testid="phase25-input"
            @update:value="
              (v) => {
                phase25InputText = v;
              }
            "
          />
          <ChronixInput
            :value="phase25InputTextarea"
            type="textarea"
            :rows="3"
            data-testid="phase25-input-textarea"
            @update:value="
              (v) => {
                phase25InputTextarea = v;
              }
            "
          />
          <ChronixInput
            :value="phase25InputClearable"
            :clearable="true"
            data-testid="phase25-input-clearable"
            @update:value="
              (v) => {
                phase25InputClearable = v;
              }
            "
          />
          <ChronixInputOtp
            :value="phase25Otp"
            :length="6"
            data-testid="phase25-input-otp"
            @update:value="
              (v) => {
                phase25Otp = v;
              }
            "
          />
        </div>
      </section>

      <section class="demo-section">
        <h2>Checkbox + Switch</h2>
        <div style="display: flex; flex-direction: column; gap: 12px">
          <ChronixCheckbox
            :checked="phase25CheckboxChecked"
            label="Accept terms"
            data-testid="phase25-checkbox"
            @update:checked="
              (v) => {
                phase25CheckboxChecked = v;
              }
            "
          />
          <ChronixCheckbox
            :checked="true"
            :indeterminate="phase25CheckboxIndeterminate"
            label="Parent of selection"
            data-testid="phase25-checkbox-indeterminate"
          />
          <ChronixSwitch
            :checked="phase25SwitchChecked"
            data-testid="phase25-switch"
            @update:checked="
              (v) => {
                phase25SwitchChecked = v;
              }
            "
          />
        </div>
      </section>

      <section class="demo-section">
        <h2>Radio + Rate + InputNumber</h2>
        <div style="display: flex; flex-direction: column; gap: 12px">
          <ChronixRadioGroup
            :value="phase25RadioValue"
            :options="PHASE25_RADIO_OPTIONS"
            data-testid="phase25-radio-group"
            @update:value="
              (v) => {
                phase25RadioValue = v;
              }
            "
          />
          <ChronixRate
            :value="phase25Rate"
            data-testid="phase25-rate"
            @update:value="
              (v) => {
                phase25Rate = v;
              }
            "
          />
          <ChronixRate
            :value="phase25RateHalf"
            :allowHalf="true"
            data-testid="phase25-rate-half"
            @update:value="
              (v) => {
                phase25RateHalf = v;
              }
            "
          />
          <ChronixInputNumber
            :value="phase25NumberValue"
            :min="0"
            :max="100"
            :step="5"
            data-testid="phase25-input-number"
            @update:value="
              (v) => {
                phase25NumberValue = v;
              }
            "
          />
        </div>
      </section>

      <section class="demo-section">
        <h2>AutoComplete</h2>
        <div style="display: flex; flex-direction: column; gap: 12px; max-width: 360px">
          <ChronixAutoComplete
            :value="phase25AutoCompleteValue"
            :options="PHASE25_AUTOCOMPLETE_OPTIONS"
            placeholder="Type a state name"
            data-testid="phase25-autocomplete"
            @update:value="
              (v) => {
                phase25AutoCompleteValue = v;
              }
            "
          />
        </div>
      </section>

      <ChronixDivider data-testid="divider-popover-infra-section">
        Popover infrastructure (4 components)
      </ChronixDivider>

      <section class="demo-section">
        <h2>Popover + Tooltip (show=true demo)</h2>
        <div style="display: flex; flex-direction: column; gap: 80px; margin-top: 60px">
          <ChronixPopover
            :show="true"
            trigger="manual"
            placement="bottom"
            :flip="false"
            data-testid="phase26-popover"
          >
            <ChronixButton>Popover anchor</ChronixButton>
            <template #content>Popover body content</template>
          </ChronixPopover>
          <ChronixTooltip
            :show="true"
            trigger="manual"
            placement="top"
            :flip="false"
            content="Tooltip text"
            data-testid="phase26-tooltip"
          >
            <ChronixButton>Tooltip anchor</ChronixButton>
          </ChronixTooltip>
        </div>
      </section>

      <section class="demo-section">
        <h2>Popconfirm + PopSelect (show=true demo)</h2>
        <div style="display: flex; flex-direction: column; gap: 100px; margin-top: 80px">
          <ChronixPopconfirm
            :show="true"
            trigger="manual"
            placement="top"
            :flip="false"
            title="Delete this item?"
            positiveText="Delete"
            negativeText="Keep"
            data-testid="phase26-popconfirm"
          >
            <ChronixButton>Popconfirm anchor</ChronixButton>
          </ChronixPopconfirm>
          <ChronixPopSelect
            :show="true"
            trigger="manual"
            placement="bottom-start"
            :flip="false"
            :options="PHASE26_POP_SELECT_OPTIONS"
            :value="phase26PopSelectValue"
            data-testid="phase26-pop-select"
            @update:value="
              (v) => {
                phase26PopSelectValue = v;
              }
            "
          >
            <ChronixButton>PopSelect anchor</ChronixButton>
          </ChronixPopSelect>
        </div>
      </section>

      <ChronixDivider title-placement="left">
        Popover-consuming Tier B (6 components)
      </ChronixDivider>

      <section class="demo-section">
        <h2>Modal + Drawer (click to open)</h2>
        <div style="display: flex; gap: 16px; flex-wrap: wrap">
          <ChronixButton data-testid="phase27-modal-toggle" @click="phase27ModalShow = true">
            Open Modal
          </ChronixButton>
          <ChronixButton data-testid="phase27-drawer-toggle" @click="phase27DrawerShow = true">
            Open Drawer
          </ChronixButton>
        </div>
        <ChronixModal
          :show="phase27ModalShow"
          title="Confirm action"
          :width="360"
          data-testid="phase27-modal"
          @update:show="
            (v) => {
              phase27ModalShow = v;
            }
          "
        >
          Modal body content.
          <template v-slot:footer>
            <ChronixButton @click="phase27ModalShow = false">Cancel</ChronixButton>
            <ChronixButton variant="primary" @click="phase27ModalShow = false"
              >Confirm</ChronixButton
            >
          </template>
        </ChronixModal>
        <ChronixDrawer
          :show="phase27DrawerShow"
          placement="right"
          title="Drawer right"
          :width="280"
          data-testid="phase27-drawer"
          @update:show="
            (v) => {
              phase27DrawerShow = v;
            }
          "
        >
          Drawer body content.
        </ChronixDrawer>
      </section>

      <section class="demo-section">
        <h2>Dropdown + Menu</h2>
        <div style="display: flex; gap: 60px; align-items: flex-start; margin-top: 40px">
          <ChronixDropdown
            :show="true"
            trigger="manual"
            placement="bottom-start"
            :flip="false"
            :options="PHASE27_DROPDOWN_OPTIONS"
            data-testid="phase27-dropdown"
          >
            <ChronixButton>Dropdown anchor</ChronixButton>
          </ChronixDropdown>
          <ChronixMenu
            value="analytics.dashboard"
            :items="PHASE27_MENU_ITEMS"
            mode="vertical"
            data-testid="phase27-menu"
          />
        </div>
      </section>

      <section class="demo-section">
        <h2>Affix + BackTop</h2>
        <div style="display: flex; gap: 40px; align-items: flex-start">
          <ChronixAffix :top="0" data-testid="phase27-affix">
            <ChronixButton>Pinned-to-top content</ChronixButton>
          </ChronixAffix>
          <ChronixBackTop
            :visibility-threshold="0"
            :right="40"
            :bottom="40"
            data-testid="phase27-back-top"
          />
        </div>
      </section>

      <ChronixDivider title-placement="left"> Layout family (8 components) </ChronixDivider>

      <section class="demo-section">
        <h2>Layout shell (header + sider + content + footer)</h2>
        <div style="border: 1px solid #d1d5db; height: 200px">
          <ChronixLayout data-testid="phase28-layout">
            <ChronixLayoutSider :width="140" />
            <ChronixLayout>
              <ChronixLayoutHeader>Header</ChronixLayoutHeader>
              <ChronixLayoutContent>Content body</ChronixLayoutContent>
              <ChronixLayoutFooter>Footer</ChronixLayoutFooter>
            </ChronixLayout>
          </ChronixLayout>
        </div>
      </section>

      <section class="demo-section">
        <h2>Tabs</h2>
        <ChronixTabs
          :value="phase28TabValue"
          :items="PHASE28_TAB_ITEMS"
          data-testid="phase28-tabs"
          @update:value="(v) => (phase28TabValue = v)"
        />
      </section>

      <section class="demo-section">
        <h2>Collapse + CollapseTransition</h2>
        <ChronixCollapse
          :value="phase28CollapseValue"
          :items="PHASE28_COLLAPSE_ITEMS"
          data-testid="phase28-collapse"
          @update:value="
            (v) => (phase28CollapseValue = Array.isArray(v) ? v : v === undefined ? [] : [v])
          "
        />
        <div style="margin-top: 16px">
          <ChronixCollapseTransition :show="true" data-testid="phase28-collapse-transition">
            <div style="padding: 12px; border: 1px solid #d1d5db">
              Direct CollapseTransition consumer (always expanded).
            </div>
          </ChronixCollapseTransition>
        </div>
      </section>

      <section class="demo-section">
        <h2>Split + Image</h2>
        <div style="height: 140px; border: 1px solid #d1d5db">
          <ChronixSplit data-testid="phase28-split">
            <template #first>
              <div style="padding: 12px">Pane A</div>
            </template>
            <template #second>
              <div style="padding: 12px">Pane B</div>
            </template>
          </ChronixSplit>
        </div>
        <div style="margin-top: 16px">
          <ChronixImage
            src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='100'%3E%3Crect width='160' height='100' fill='%232563eb'/%3E%3C/svg%3E"
            :width="160"
            :height="100"
            data-testid="phase28-image"
          />
        </div>
      </section>

      <section class="demo-section">
        <h2>FloatButton + FloatButtonGroup</h2>
        <div style="position: relative; height: 120px; border: 1px dashed #9ca3af">
          <ChronixFloatButton
            description="A"
            :right="200"
            :bottom="200"
            data-testid="phase28-float-button"
          />
          <ChronixFloatButtonGroup
            :right="100"
            :bottom="200"
            data-testid="phase28-float-button-group"
          >
            <ChronixFloatButton description="1" :right="0" :bottom="0" />
            <ChronixFloatButton description="2" :right="0" :bottom="0" />
          </ChronixFloatButtonGroup>
        </div>
      </section>

      <ChronixDivider title-placement="left"> Tier B remainder (3 components) </ChronixDivider>

      <section class="demo-section">
        <h2>Carousel</h2>
        <ChronixCarousel
          :value="phase29CarouselValue"
          :items="PHASE29_CAROUSEL_ITEMS"
          :autoplay="false"
          data-testid="phase29-carousel"
          @update:value="(v) => (phase29CarouselValue = v)"
        />
      </section>

      <section class="demo-section">
        <h2>Wave (click the button to ripple)</h2>
        <ChronixWave data-testid="phase29-wave">
          <ChronixButton>Click me</ChronixButton>
        </ChronixWave>
      </section>

      <section class="demo-section">
        <h2>FocusDetector (focus the input to fire events)</h2>
        <ChronixFocusDetector data-testid="phase29-focus-detector">
          <input type="text" placeholder="Focus to fire chronix focus event" />
        </ChronixFocusDetector>
      </section>

      <ChronixDivider title-placement="left"> Tier C Tree (1 component) </ChronixDivider>

      <section class="demo-section">
        <h2>Tree (single-select, one branch expanded)</h2>
        <ChronixTree
          :value="phase30TreeValue"
          :items="PHASE30_TREE_ITEMS"
          :expanded-keys="phase30TreeExpandedKeys"
          data-testid="phase30-tree"
          @update:value="(v) => (phase30TreeValue = v)"
          @update:expanded-keys="(keys) => (phase30TreeExpandedKeys = Array.from(keys))"
        />
      </section>

      <section class="demo-section">
        <h2>Tree (virtual mode — 50 nodes, height 200)</h2>
        <ChronixTree
          :value="phase30VirtualTreeValue"
          :items="PHASE30_VIRTUAL_TREE_ITEMS"
          :virtual="true"
          :virtual-item-height="28"
          :height="200"
          data-testid="phase30-tree-virtual"
          @update:value="(v) => (phase30VirtualTreeValue = v)"
        />
      </section>

      <ChronixDivider title-placement="left"> Tier C Select family (4 components) </ChronixDivider>

      <section class="demo-section">
        <h2>Select (single)</h2>
        <ChronixSelect
          :options="PHASE31_SELECT_OPTIONS"
          :value="phase31SelectValue"
          placeholder="Select..."
          data-testid="phase31-select"
          @update:value="setPhase31SelectValue"
        />
      </section>

      <section class="demo-section">
        <h2>Select (multiple)</h2>
        <ChronixSelect
          :options="PHASE31_SELECT_OPTIONS"
          :value="phase31SelectMultiValue"
          :multiple="true"
          placeholder="Select..."
          data-testid="phase31-select-multi"
          @update:value="setPhase31SelectMultiValue"
        />
      </section>

      <section class="demo-section">
        <h2>TreeSelect</h2>
        <ChronixTreeSelect
          :data="PHASE31_TREE_DATA"
          :value="phase31TreeSelectValue"
          :expanded-keys="phase31TreeSelectExpandedKeys"
          placeholder="Select node..."
          @update:value="setPhase31TreeSelectValue"
          @update:expanded-keys="setPhase31TreeSelectExpandedKeys"
          data-testid="phase31-tree-select"
        />
      </section>

      <section class="demo-section">
        <h2>Cascader</h2>
        <ChronixCascader
          :options="PHASE31_CASCADER_OPTIONS"
          :value="phase31CascaderValue"
          placeholder="Select..."
          data-testid="phase31-cascader"
          @update:value="setPhase31CascaderValue"
        />
      </section>

      <section class="demo-section">
        <h2>Mention (type @ in textarea)</h2>
        <ChronixMention
          :options="PHASE31_MENTION_OPTIONS"
          :value="phase31MentionValue"
          placeholder="Type @ to mention..."
          data-testid="phase31-mention"
          @update:value="(v) => (phase31MentionValue = v)"
        />
      </section>

      <ChronixDivider title-placement="left">
        DatePicker / TimePicker / Calendar (3 components)
      </ChronixDivider>

      <section class="demo-section">
        <h2>DatePicker</h2>
        <ChronixDatePicker
          :value="phase32DatePickerValue"
          placeholder="Pick a date"
          format="yyyy-MM-dd"
          data-testid="phase32-date-picker"
          @update:value="(v) => (phase32DatePickerValue = v)"
        />
      </section>

      <section class="demo-section">
        <h2>TimePicker</h2>
        <ChronixTimePicker
          :value="phase32TimePickerValue"
          placeholder="Pick time"
          format="HH:mm:ss"
          data-testid="phase32-time-picker"
          @update:value="(v) => (phase32TimePickerValue = v)"
        />
      </section>

      <section class="demo-section">
        <h2>Calendar</h2>
        <ChronixCalendar
          :value="phase32CalendarValue"
          data-testid="phase32-calendar"
          @update:value="(v) => (phase32CalendarValue = v)"
        />
      </section>

      <section class="demo-section">
        <h2>ColorPicker</h2>
        <ChronixColorPicker
          :value="phase33ColorPickerValue"
          :swatches="['#ff0000', '#00ff00', '#0000ff', '#ffff00']"
          data-testid="phase33-color-picker"
          @update:value="(v) => (phase33ColorPickerValue = v)"
        />
      </section>

      <section class="demo-section">
        <h2>Transfer</h2>
        <ChronixTransfer
          :value="phase33TransferValue"
          :options="[
            { label: 'Apple', value: 'a' },
            { label: 'Banana', value: 'b' },
            { label: 'Cherry', value: 'c' },
            { label: 'Date', value: 'd' },
          ]"
          :filterable="true"
          data-testid="phase33-transfer"
          @update:value="(v) => (phase33TransferValue = v)"
        />
      </section>

      <section class="demo-section">
        <h2>Slider</h2>
        <ChronixSlider
          :value="phase33SliderValue"
          :min="0"
          :max="100"
          data-testid="phase33-slider"
          @update:value="setPhase33SliderValue"
        />
      </section>

      <section class="demo-section">
        <h2>Pagination</h2>
        <ChronixPagination
          :page="phase33PaginationPage"
          :page-count="10"
          data-testid="phase33-pagination"
          @update:page="(v) => (phase33PaginationPage = v)"
        />
      </section>

      <section class="demo-section">
        <h2>Form</h2>
        <ChronixForm
          :model="phase34Model"
          :rules="phase34Rules"
          label-placement="left"
          :label-width="80"
          data-testid="phase34-form"
        >
          <ChronixFormItem label="Name" path="name">
            <input v-model="phase34Model.name" data-testid="phase34-input-name" />
          </ChronixFormItem>
          <ChronixFormItem label="Email" path="email">
            <input v-model="phase34Model.email" data-testid="phase34-input-email" />
          </ChronixFormItem>
        </ChronixForm>
      </section>

      <ChronixDivider title-placement="left">
        DynamicInput / DynamicTags / Anchor / NumberAnimation / Scrollbar / Upload
      </ChronixDivider>

      <section class="demo-section">
        <h2>DynamicInput</h2>
        <ChronixDynamicInput
          :value="phase35DynamicInputValue"
          data-testid="phase35-dynamic-input"
          @update:value="(v) => (phase35DynamicInputValue = v)"
        />
      </section>

      <section class="demo-section">
        <h2>DynamicTags</h2>
        <ChronixDynamicTags
          :value="phase35DynamicTagsValue"
          data-testid="phase35-dynamic-tags"
          @update:value="(v) => (phase35DynamicTagsValue = v)"
        />
      </section>

      <section class="demo-section">
        <h2>Anchor</h2>
        <ChronixAnchor
          :items="[
            { key: 'a', label: 'Section A', href: '#a' },
            { key: 'b', label: 'Section B', href: '#b' },
          ]"
          data-testid="phase35-anchor"
        />
      </section>

      <section class="demo-section">
        <h2>NumberAnimation</h2>
        <ChronixNumberAnimation
          :from="0"
          :to="phase35NumberAnimationTo"
          :duration="1000"
          data-testid="phase35-number-animation"
        />
      </section>

      <section class="demo-section">
        <h2>Scrollbar</h2>
        <ChronixScrollbar data-testid="phase35-scrollbar"
          ><div style="height: 200px">Scrollable content</div></ChronixScrollbar
        >
      </section>

      <section class="demo-section">
        <h2>Upload</h2>
        <ChronixUpload action="#" :file-list="phase35UploadFiles" data-testid="phase35-upload" />
      </section>

      <ChronixDivider title-placement="left">
        Carousel lazy + thumbnails / Tabs editable / Mention multi-source
      </ChronixDivider>

      <section class="demo-section">
        <h2>Carousel (lazy + thumbnails)</h2>
        <ChronixCarousel
          :items="PHASE37_LAZY_CAROUSEL_ITEMS"
          :value="phase37LazyCarouselValue"
          :lazy="true"
          :thumbnails="true"
          @update:value="(v) => (phase37LazyCarouselValue = v)"
          data-testid="phase37-carousel-lazy"
        />
      </section>

      <section class="demo-section">
        <h2>Tabs (closable + addable + draggable)</h2>
        <ChronixTabs
          :items="PHASE37_TAB_ITEMS"
          :value="phase37TabsValue"
          :addable="true"
          :draggable="true"
          @update:value="(v) => (phase37TabsValue = v)"
          data-testid="phase37-tabs-editable"
        />
      </section>

      <section class="demo-section">
        <h2>Mention (multi-source @ #)</h2>
        <ChronixMention
          :value="phase37MentionValue"
          :sources="PHASE37_MENTION_SOURCES"
          @update:value="(v) => (phase37MentionValue = v)"
          data-testid="phase37-mention-multi"
        />
      </section>
    </div>
  </ChronixUIProvider>
</template>
