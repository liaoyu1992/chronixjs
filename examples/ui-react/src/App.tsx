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
  ChronixNumberAnimation,
  ChronixScrollbar,
  ChronixUpload,
} from '@chronixjs/ui-react';
import { useState } from 'react';

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

const PHASE26_POP_SELECT_OPTIONS: readonly PopSelectOption[] = [
  { key: 'a', label: 'Action one', value: 'a', disabled: false },
  { key: 'b', label: 'Action two', value: 'b', disabled: false },
  { key: 'c', label: 'Action three (disabled)', value: 'c', disabled: true },
];

// Layout family (8 components).
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

export function App(): JSX.Element {
  const [clickCount, setClickCount] = useState(0);
  const [blockedClickCount, setBlockedClickCount] = useState(0);
  const [tagCloseCount, setTagCloseCount] = useState(0);
  const [pageHeaderBackCount, setPageHeaderBackCount] = useState(0);
  const [breadcrumbClickCount, setBreadcrumbClickCount] = useState(0);
  // Tier B form input demo state
  const [phase25InputText, setPhase25InputText] = useState('Hello');
  const [phase25InputTextarea, setPhase25InputTextarea] = useState('Line 1\nLine 2');
  const [phase25InputClearable, setPhase25InputClearable] = useState('Clear me');
  const [phase25Otp, setPhase25Otp] = useState('12');
  const [phase25CheckboxChecked, setPhase25CheckboxChecked] = useState(true);
  const [phase25RadioValue, setPhase25RadioValue] = useState('a');
  const [phase25SwitchChecked, setPhase25SwitchChecked] = useState(true);
  const [phase25Rate, setPhase25Rate] = useState(3);
  const [phase25RateHalf, setPhase25RateHalf] = useState(2.5);
  const [phase25NumberValue, setPhase25NumberValue] = useState<number | null>(10);
  const [phase25AutoCompleteValue, setPhase25AutoCompleteValue] = useState('');
  const [phase26PopSelectValue, setPhase26PopSelectValue] = useState('a');
  // Popover-consuming Tier B demo state (toggle-controlled)
  const [phase27ModalShow, setPhase27ModalShow] = useState(false);
  const [phase27DrawerShow, setPhase27DrawerShow] = useState(false);
  // Layout family demo state
  const [phase28CollapseValue, setPhase28CollapseValue] = useState<readonly string[]>(['a']);
  const [phase28TabValue, setPhase28TabValue] = useState<string>('overview');
  // Tier B remainder demo state
  const [phase29CarouselValue, setPhase29CarouselValue] = useState<number>(0);
  // Tier C Tree demo state
  const [phase30TreeValue, setPhase30TreeValue] = useState<string | undefined>('docs/intro');
  const [phase30TreeExpandedKeys, setPhase30TreeExpandedKeys] = useState<readonly string[]>([
    'docs',
  ]);
  const [phase30VirtualTreeValue, setPhase30VirtualTreeValue] = useState<string | undefined>(
    undefined,
  );

  // Select family
  const PHASE31_SELECT_OPTIONS: any[] = [
    { key: 'apple', label: 'Apple', value: 'apple' },
    { key: 'banana', label: 'Banana', value: 'banana' },
    { key: 'cherry', label: 'Cherry', value: 'cherry' },
  ];
  const [phase31SelectValue, setPhase31SelectValue] = useState<string | undefined>(undefined);
  const [phase31SelectMultiValue, setPhase31SelectMultiValue] = useState<string[]>([]);

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
  const [phase31TreeSelectValue, setPhase31TreeSelectValue] = useState<string | undefined>(
    undefined,
  );
  const [phase31TreeSelectExpandedKeys, setPhase31TreeSelectExpandedKeys] = useState<string[]>([
    't1',
  ]);

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
  const [phase31CascaderValue, setPhase31CascaderValue] = useState<string | undefined>(undefined);

  const PHASE31_MENTION_OPTIONS: any[] = [
    { key: 'alice', label: 'Alice', value: 'alice' },
    { key: 'bob', label: 'Bob', value: 'bob' },
    { key: 'charlie', label: 'Charlie', value: 'charlie' },
  ];
  const [phase31MentionValue, setPhase31MentionValue] = useState('');

  // DatePicker / TimePicker / Calendar
  const [phase32DatePickerValue, setPhase32DatePickerValue] = useState<Date | undefined>(undefined);
  const [phase32TimePickerValue, setPhase32TimePickerValue] = useState<Date | undefined>(undefined);
  const [phase32CalendarValue, setPhase32CalendarValue] = useState<Date | undefined>(undefined);

  // ColorPicker / Transfer / Slider / Pagination
  const [phase33ColorPickerValue, setPhase33ColorPickerValue] = useState<string | null>('#4096ff');
  const [phase33TransferValue, setPhase33TransferValue] = useState<(string | number)[]>(['a']);
  const [phase33SliderValue, setPhase33SliderValue] = useState(50);
  const [phase33PaginationPage, setPhase33PaginationPage] = useState(1);

  const [phase34Model, setPhase34Model] = useState<Record<string, unknown>>({
    name: '',
    email: '',
  });

  // DynamicInput / DynamicTags / Anchor / InfiniteScroll / NumberAnimation / Scrollbar / Upload
  const [phase35DynamicInputValue, setPhase35DynamicInputValue] = useState<unknown[]>([
    'Item 1',
    'Item 2',
  ]);
  const [phase35DynamicTagsValue, setPhase35DynamicTagsValue] = useState<string[]>([
    'Tag 1',
    'Tag 2',
  ]);
  const [phase35NumberAnimationTo] = useState(100);
  const [phase35UploadFiles] = useState<any[]>([]);

  // Carousel lazy + thumbnails
  const PHASE37_LAZY_CAROUSEL_ITEMS = [
    { key: 'la', content: 'Lazy A', thumbnailLabel: 'A' },
    { key: 'lb', content: 'Lazy B', thumbnailLabel: 'B' },
    { key: 'lc', content: 'Lazy C', thumbnailLabel: 'C' },
    { key: 'ld', content: 'Lazy D', thumbnailLabel: 'D' },
    { key: 'le', content: 'Lazy E', thumbnailLabel: 'E' },
  ];
  const [phase37LazyCarouselValue, setPhase37LazyCarouselValue] = useState(0);

  // Tabs editable
  const PHASE37_TAB_ITEMS = [
    { key: 'p1', label: 'Tab 1', disabled: false, content: 'Content 1', closable: true },
    { key: 'p2', label: 'Tab 2', disabled: false, content: 'Content 2', closable: true },
    { key: 'p3', label: 'Tab 3', disabled: false, content: 'Content 3', closable: true },
  ];
  const [phase37TabsValue, setPhase37TabsValue] = useState('p1');

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
  const [phase37MentionValue, setPhase37MentionValue] = useState('');

  const handleClick = (): void => setClickCount((n) => n + 1);
  const handleBlockedClick = (): void => setBlockedClickCount((n) => n + 1);
  const handleTagClose = (): void => setTagCloseCount((n) => n + 1);
  const handlePageHeaderBack = (): void => setPageHeaderBackCount((n) => n + 1);
  const handleBreadcrumbItemClick = (_item: BreadcrumbItem): void =>
    setBreadcrumbClickCount((n) => n + 1);

  return (
    <ChronixUIProvider>
      <div className="demo-page" data-testid="demo-page">
        <h1>@chronixjs/ui-react demo</h1>
        <p>Button cross-adapter parity — port 8733.</p>

        <section className="demo-section">
          <h2>Variants</h2>
          <div className="demo-row">
            <ChronixButton data-testid="btn-default" onClick={handleClick}>
              Default
            </ChronixButton>
            <ChronixButton variant="primary" data-testid="btn-primary" onClick={handleClick}>
              Primary
            </ChronixButton>
          </div>
        </section>

        <section className="demo-section">
          <h2>Sizes</h2>
          <div className="demo-row">
            <ChronixButton size="small" data-testid="btn-small">
              Small
            </ChronixButton>
            <ChronixButton size="medium" data-testid="btn-medium">
              Medium
            </ChronixButton>
            <ChronixButton size="large" data-testid="btn-large">
              Large
            </ChronixButton>
          </div>
        </section>

        <section className="demo-section">
          <h2>Disabled gate</h2>
          <div className="demo-row">
            <ChronixButton
              variant="primary"
              disabled
              data-testid="btn-disabled"
              onClick={handleBlockedClick}
            >
              Disabled (clicks suppressed)
            </ChronixButton>
          </div>
          <div className="demo-counter">
            Disabled click count: <strong data-testid="counter-blocked">{blockedClickCount}</strong>
          </div>
        </section>

        <section className="demo-section">
          <h2>Block (full-width)</h2>
          <ChronixButton variant="primary" block data-testid="btn-block">
            Block-mode button
          </ChronixButton>
        </section>

        <section className="demo-section">
          <h2>Click counter (verifies event emission)</h2>
          <div className="demo-row">
            <ChronixButton data-testid="btn-increment" onClick={handleClick}>
              +1
            </ChronixButton>
            <ChronixButton
              variant="primary"
              data-testid="btn-increment-primary"
              onClick={handleClick}
            >
              +1 (primary)
            </ChronixButton>
          </div>
          <div className="demo-counter">
            Active click count: <strong data-testid="counter-active">{clickCount}</strong>
          </div>
        </section>

        <ChronixDivider data-testid="divider-section">Tag + Divider</ChronixDivider>

        <section className="demo-section">
          <h2>Tag types</h2>
          <div className="demo-row">
            <ChronixTag data-testid="tag-default">Default</ChronixTag>
            <ChronixTag type="primary" data-testid="tag-primary">
              Primary
            </ChronixTag>
            <ChronixTag type="info" data-testid="tag-info">
              Info
            </ChronixTag>
            <ChronixTag type="success" data-testid="tag-success">
              Success
            </ChronixTag>
            <ChronixTag type="warning" data-testid="tag-warning">
              Warning
            </ChronixTag>
            <ChronixTag type="error" data-testid="tag-error">
              Error
            </ChronixTag>
          </div>
        </section>

        <section className="demo-section">
          <h2>Tag sizes + modifiers</h2>
          <div className="demo-row">
            <ChronixTag size="small" data-testid="tag-small">
              Small
            </ChronixTag>
            <ChronixTag size="medium" data-testid="tag-medium">
              Medium
            </ChronixTag>
            <ChronixTag size="large" data-testid="tag-large">
              Large
            </ChronixTag>
            <ChronixTag round data-testid="tag-round">
              Round
            </ChronixTag>
            <ChronixTag type="primary" closable data-testid="tag-closable" onClose={handleTagClose}>
              Closable
            </ChronixTag>
            <ChronixTag disabled data-testid="tag-disabled">
              Disabled
            </ChronixTag>
          </div>
          <div className="demo-counter">
            Tag close count: <strong data-testid="counter-tag-close">{tagCloseCount}</strong>
          </div>
        </section>

        <section className="demo-section">
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
          <ChronixDivider dashed data-testid="divider-dashed" />
          <p>Above: dashed line.</p>
          <span>Inline text</span>
          <ChronixDivider vertical data-testid="divider-vertical" />
          <span>after vertical divider</span>
        </section>

        <ChronixDivider data-testid="divider-badge-section">Badge</ChronixDivider>

        <section className="demo-section">
          <h2>Badge standalone (numeric + truncation + string)</h2>
          <div className="demo-row">
            <ChronixBadge value={5} data-testid="badge-numeric" />
            <ChronixBadge value={999} max={99} data-testid="badge-truncated" />
            <ChronixBadge value="NEW" data-testid="badge-string" />
          </div>
        </section>

        <section className="demo-section">
          <h2>Badge types (standalone)</h2>
          <div className="demo-row">
            <ChronixBadge value={1} type="default" data-testid="badge-type-default" />
            <ChronixBadge value={2} type="success" data-testid="badge-type-success" />
            <ChronixBadge value={3} type="warning" data-testid="badge-type-warning" />
            <ChronixBadge value={4} type="error" data-testid="badge-type-error" />
            <ChronixBadge value={5} type="info" data-testid="badge-type-info" />
          </div>
        </section>

        <section className="demo-section">
          <h2>Badge modifiers (dot / processing / hidden)</h2>
          <div className="demo-row">
            <ChronixBadge dot type="success" data-testid="badge-dot" />
            <ChronixBadge dot processing type="warning" data-testid="badge-processing" />
            <ChronixBadge value={42} show={false} data-testid="badge-hidden" />
          </div>
        </section>

        <section className="demo-section">
          <h2>Badge wrapping a child</h2>
          <div className="demo-row" style={{ gap: 32 }}>
            <ChronixBadge value={3} data-testid="badge-wrapping-numeric">
              <ChronixButton>Inbox</ChronixButton>
            </ChronixBadge>
            <ChronixBadge dot type="success" data-testid="badge-wrapping-dot">
              <ChronixButton variant="primary">Online</ChronixButton>
            </ChronixBadge>
            <ChronixBadge value={200} max={99} type="error" data-testid="badge-wrapping-trunc">
              <ChronixButton>Errors</ChronixButton>
            </ChronixBadge>
          </div>
        </section>

        <ChronixDivider data-testid="divider-info-section">Alert + Card + Empty</ChronixDivider>

        <section className="demo-section">
          <h2>Alert types</h2>
          <ChronixAlert type="default" title="Default" data-testid="alert-default">
            Default alert message.
          </ChronixAlert>
          <div style={{ height: 8 }}></div>
          <ChronixAlert type="info" title="Info" data-testid="alert-info">
            Informational message.
          </ChronixAlert>
          <div style={{ height: 8 }}></div>
          <ChronixAlert type="success" title="Success" data-testid="alert-success">
            Success message.
          </ChronixAlert>
          <div style={{ height: 8 }}></div>
          <ChronixAlert type="warning" title="Warning" data-testid="alert-warning">
            Warning message.
          </ChronixAlert>
          <div style={{ height: 8 }}></div>
          <ChronixAlert type="error" title="Error" data-testid="alert-error">
            Error message.
          </ChronixAlert>
          <div style={{ height: 8 }}></div>
          <ChronixAlert type="info" closable data-testid="alert-closable">
            Closable alert (no title).
          </ChronixAlert>
        </section>

        <section className="demo-section">
          <h2>Card variants</h2>
          <div className="demo-row" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <ChronixCard title="Basic" data-testid="card-basic" style={{ flex: 1, minWidth: 240 }}>
              Default card with title + body.
            </ChronixCard>
            <ChronixCard
              title="With footer"
              footer={<ChronixButton size="small">OK</ChronixButton>}
              data-testid="card-with-footer"
              style={{ flex: 1, minWidth: 240 }}
            >
              Body content here.
            </ChronixCard>
            <ChronixCard
              size="small"
              hoverable
              data-testid="card-hoverable"
              style={{ flex: 1, minWidth: 240 }}
            >
              Small + hoverable card (no title).
            </ChronixCard>
          </div>
          <div style={{ height: 16 }}></div>
          <ChronixCard embedded title="Embedded" data-testid="card-embedded">
            Embedded variant — flat blends with background.
          </ChronixCard>
        </section>

        <section className="demo-section">
          <h2>Empty states</h2>
          <div className="demo-row" style={{ alignItems: 'flex-start', gap: 32 }}>
            <ChronixEmpty data-testid="empty-default" />
            <ChronixEmpty size="small" description="Small empty" data-testid="empty-small" />
            <ChronixEmpty data-testid="empty-with-action">
              <ChronixButton variant="primary" size="small">
                Add row
              </ChronixButton>
            </ChronixEmpty>
          </div>
        </section>

        <ChronixDivider data-testid="divider-loading-section">
          Loading states (Spin + Progress + Skeleton)
        </ChronixDivider>

        <section className="demo-section">
          <h2>Spin sizes + description + hidden</h2>
          <div className="demo-row" style={{ gap: 32, alignItems: 'flex-start' }}>
            <ChronixSpin data-testid="spin-default" />
            <ChronixSpin description="Loading data" data-testid="spin-with-desc" />
            <ChronixSpin size="small" description="Small" data-testid="spin-small" />
            <ChronixSpin size="large" data-testid="spin-large" />
            <ChronixSpin show={false} data-testid="spin-hidden" />
          </div>
        </section>

        <section className="demo-section">
          <h2>Progress types + placements + custom height</h2>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              maxWidth: 360,
            }}
          >
            <ChronixProgress percentage={42} data-testid="progress-default" />
            <ChronixProgress type="success" percentage={80} data-testid="progress-success" />
            <ChronixProgress type="warning" percentage={55} data-testid="progress-warning" />
            <ChronixProgress type="error" percentage={12} data-testid="progress-error" />
            <ChronixProgress type="info" percentage={33} data-testid="progress-info" />
            <ChronixProgress
              percentage={60}
              indicatorPlacement="inside"
              height={18}
              data-testid="progress-inside"
            />
            <ChronixProgress percentage={70} showInfo={false} data-testid="progress-no-info" />
            <ChronixProgress percentage={88} height={14} data-testid="progress-tall" />
          </div>
        </section>

        <section className="demo-section">
          <h2>Skeleton shapes + sizing + modifiers</h2>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              maxWidth: 360,
            }}
          >
            <ChronixSkeleton data-testid="skeleton-text" />
            <ChronixSkeleton width={200} height={60} shape="rect" data-testid="skeleton-rect" />
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <ChronixSkeleton shape="circle" data-testid="skeleton-circle" />
              <ChronixSkeleton animated={false} width={160} data-testid="skeleton-static" />
              <ChronixSkeleton round width={120} height={12} data-testid="skeleton-round" />
            </div>
          </div>
        </section>

        <ChronixDivider data-testid="divider-layout-section">
          Layout primitives (Space + Flex + Grid)
        </ChronixDivider>

        <section className="demo-section">
          <h2>Space — token + numeric size, vertical, justify</h2>
          <ChronixSpace data-testid="space-default">
            <ChronixTag>A</ChronixTag>
            <ChronixTag>B</ChronixTag>
            <ChronixTag>C</ChronixTag>
          </ChronixSpace>
          <div style={{ height: 16 }} />
          <ChronixSpace vertical data-testid="space-vertical">
            <ChronixTag>1</ChronixTag>
            <ChronixTag>2</ChronixTag>
            <ChronixTag>3</ChronixTag>
          </ChronixSpace>
          <div style={{ height: 16 }} />
          <ChronixSpace size="large" data-testid="space-large">
            <ChronixTag>X</ChronixTag>
            <ChronixTag>Y</ChronixTag>
            <ChronixTag>Z</ChronixTag>
          </ChronixSpace>
          <div style={{ height: 16 }} />
          <ChronixSpace size={20} data-testid="space-numeric">
            <ChronixTag>P</ChronixTag>
            <ChronixTag>Q</ChronixTag>
            <ChronixTag>R</ChronixTag>
          </ChronixSpace>
          <div style={{ height: 16 }} />
          <ChronixSpace
            justify="space-between"
            data-testid="space-justify-between"
            style={{ width: 320 }}
          >
            <ChronixTag>left</ChronixTag>
            <ChronixTag>right</ChronixTag>
          </ChronixSpace>
        </section>

        <section className="demo-section">
          <h2>Flex — direction, wrap, gap, align/justify</h2>
          <ChronixFlex data-testid="flex-default">
            <ChronixTag>row1</ChronixTag>
            <ChronixTag>row2</ChronixTag>
          </ChronixFlex>
          <div style={{ height: 16 }} />
          <ChronixFlex direction="column" data-testid="flex-column">
            <ChronixTag>col1</ChronixTag>
            <ChronixTag>col2</ChronixTag>
          </ChronixFlex>
          <div style={{ height: 16 }} />
          <ChronixFlex
            wrap="wrap-reverse"
            data-testid="flex-wrap-reverse"
            style={{ maxWidth: 200 }}
          >
            <ChronixTag>a</ChronixTag>
            <ChronixTag>b</ChronixTag>
            <ChronixTag>c</ChronixTag>
            <ChronixTag>d</ChronixTag>
          </ChronixFlex>
          <div style={{ height: 16 }} />
          <ChronixFlex gap="medium" data-testid="flex-gap-token">
            <ChronixTag>m1</ChronixTag>
            <ChronixTag>m2</ChronixTag>
          </ChronixFlex>
          <div style={{ height: 16 }} />
          <ChronixFlex gap={16} data-testid="flex-gap-numeric">
            <ChronixTag>n1</ChronixTag>
            <ChronixTag>n2</ChronixTag>
          </ChronixFlex>
          <div style={{ height: 16 }} />
          <ChronixFlex
            align="center"
            justify="center"
            gap={8}
            data-testid="flex-center"
            style={{ height: 80, border: '1px dashed #ccc' }}
          >
            <ChronixTag>centered</ChronixTag>
          </ChronixFlex>
        </section>

        <section className="demo-section">
          <h2>Grid — uniform N cols, custom track, inline</h2>
          <ChronixGrid cols={3} xGap={8} yGap={8} data-testid="grid-3col">
            <ChronixCard size="small" title="A">
              A
            </ChronixCard>
            <ChronixCard size="small" title="B">
              B
            </ChronixCard>
            <ChronixCard size="small" title="C">
              C
            </ChronixCard>
          </ChronixGrid>
          <div style={{ height: 16 }} />
          <ChronixGrid cols={12} xGap={4} yGap={4} data-testid="grid-12col">
            <ChronixTag>1</ChronixTag>
            <ChronixTag>2</ChronixTag>
            <ChronixTag>3</ChronixTag>
            <ChronixTag>4</ChronixTag>
            <ChronixTag>5</ChronixTag>
            <ChronixTag>6</ChronixTag>
            <ChronixTag>7</ChronixTag>
            <ChronixTag>8</ChronixTag>
          </ChronixGrid>
          <div style={{ height: 16 }} />
          <ChronixGrid cols="120px 1fr 120px" xGap={12} data-testid="grid-custom">
            <ChronixTag>L</ChronixTag>
            <ChronixTag>fluid mid</ChronixTag>
            <ChronixTag>R</ChronixTag>
          </ChronixGrid>
          <div style={{ height: 16 }} />
          <ChronixGrid inline cols={2} xGap={8} data-testid="grid-inline">
            <ChronixTag>il-a</ChronixTag>
            <ChronixTag>il-b</ChronixTag>
          </ChronixGrid>
        </section>

        <ChronixDivider data-testid="divider-status-numeric-section">
          Result + Statistic + Countdown
        </ChronixDivider>

        <section className="demo-section">
          <h2>Result — semantic + HTTP statuses</h2>
          <div className="demo-row" style={{ alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
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
              <ChronixButton variant="primary" size="small">
                Continue
              </ChronixButton>
            </ChronixResult>
          </div>
        </section>

        <section className="demo-section">
          <h2>Statistic — label / value / precision / prefix / suffix</h2>
          <div className="demo-row" style={{ gap: 32, flexWrap: 'wrap' }}>
            <ChronixStatistic label="Users" value={1234} data-testid="stat-basic" />
            <ChronixStatistic
              label="Conversion"
              value={0.4267}
              precision={2}
              data-testid="stat-precision"
            />
            <ChronixStatistic
              label="Revenue"
              value={1234.5}
              precision={2}
              prefix="$"
              data-testid="stat-prefix"
            />
            <ChronixStatistic label="Bandwidth" value={42} suffix="GB" data-testid="stat-suffix" />
            <ChronixStatistic label="Missing" data-testid="stat-placeholder" />
          </div>
        </section>

        <section className="demo-section">
          <h2>Countdown — precision + paused</h2>
          <div className="demo-row" style={{ gap: 32, flexWrap: 'wrap' }}>
            <ChronixCountdown duration={3_600_000} active={false} data-testid="countdown-basic" />
            <ChronixCountdown
              duration={3_600_000}
              precision={2}
              active={false}
              data-testid="countdown-precise"
            />
            <ChronixCountdown
              label="Sale ends in"
              duration={86_400_000}
              active={false}
              data-testid="countdown-with-label"
            />
          </div>
        </section>

        <ChronixDivider data-testid="divider-info-arch-section">
          Information architecture (PageHeader + Breadcrumb)
        </ChronixDivider>

        <section className="demo-section">
          <h2>PageHeader — title / subtitle / back / inverted / extra / full</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ChronixPageHeader
              title="Project A"
              subtitle="Owned by you"
              data-testid="page-header-default"
            />
            <ChronixPageHeader
              title="Project A"
              subtitle="Owned by you"
              back
              data-testid="page-header-with-back"
              onBack={handlePageHeaderBack}
            />
            <ChronixPageHeader
              title="Inverted header"
              subtitle="Dark surface"
              inverted
              data-testid="page-header-inverted"
            />
            <ChronixPageHeader
              title="With extra"
              subtitle="Action area on the right"
              data-testid="page-header-with-extra"
              extra={
                <>
                  <ChronixButton size="small">Cancel</ChronixButton>
                  <ChronixButton variant="primary" size="small">
                    Save
                  </ChronixButton>
                </>
              }
            />
            <ChronixPageHeader
              title="Fully populated"
              subtitle="back + avatar + extra + footer + content"
              back
              data-testid="page-header-full"
              onBack={handlePageHeaderBack}
              avatar={
                <ChronixBadge dot type="success">
                  <ChronixTag type="info">A</ChronixTag>
                </ChronixBadge>
              }
              extra={
                <ChronixButton variant="primary" size="small">
                  Save
                </ChronixButton>
              }
              footer={<span>Tabs: Overview / Details / History</span>}
            >
              Body content rendered between heading and footer.
            </ChronixPageHeader>
          </div>
          <div className="demo-counter">
            Page header back click count:{' '}
            <strong data-testid="counter-page-header-back">{pageHeaderBackCount}</strong>
          </div>
        </section>

        <section className="demo-section">
          <h2>Breadcrumb — basic / custom separator / clickable / single</h2>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              alignItems: 'flex-start',
            }}
          >
            <ChronixBreadcrumb
              items={BREADCRUMB_BASIC_ITEMS}
              data-testid="breadcrumb-basic"
              onItemClick={handleBreadcrumbItemClick}
            />
            <ChronixBreadcrumb
              items={BREADCRUMB_BASIC_ITEMS}
              separator=">"
              data-testid="breadcrumb-custom-sep"
              onItemClick={handleBreadcrumbItemClick}
            />
            <ChronixBreadcrumb
              items={BREADCRUMB_CLICKABLE_ITEMS}
              data-testid="breadcrumb-clickable"
              onItemClick={handleBreadcrumbItemClick}
            />
            <ChronixBreadcrumb
              items={BREADCRUMB_SINGLE_ITEMS}
              data-testid="breadcrumb-single"
              onItemClick={handleBreadcrumbItemClick}
            />
          </div>
          <div className="demo-counter">
            Breadcrumb item click count:{' '}
            <strong data-testid="counter-breadcrumb-click">{breadcrumbClickCount}</strong>
          </div>
        </section>

        <ChronixDivider data-testid="divider-process-timeline-section">
          Steps + Timeline
        </ChronixDivider>

        <section className="demo-section">
          <h2>Steps — horizontal / vertical / with-error / all-done / with-description</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <ChronixSteps items={STEPS_DEFAULT_ITEMS} current={1} data-testid="steps-default" />
            <ChronixSteps
              items={STEPS_DEFAULT_ITEMS}
              direction="vertical"
              current={0}
              data-testid="steps-vertical"
            />
            <ChronixSteps
              items={STEPS_WITH_ERROR_ITEMS}
              current={2}
              data-testid="steps-with-error"
            />
            <ChronixSteps items={STEPS_DEFAULT_ITEMS} current={3} data-testid="steps-all-done" />
            <ChronixSteps
              items={STEPS_WITH_DESCRIPTION_ITEMS}
              current={1}
              data-testid="steps-with-description"
            />
          </div>
        </section>

        <section className="demo-section">
          <h2>Timeline — basic / colors / with-timestamp / dashed</h2>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 32,
              flexWrap: 'wrap',
              alignItems: 'flex-start',
            }}
          >
            <ChronixTimeline items={TIMELINE_BASIC_ITEMS} data-testid="timeline-basic" />
            <ChronixTimeline items={TIMELINE_COLORS_ITEMS} data-testid="timeline-colors" />
            <ChronixTimeline
              items={TIMELINE_TIMESTAMP_ITEMS}
              data-testid="timeline-with-timestamp"
            />
            <ChronixTimeline items={TIMELINE_DASHED_ITEMS} data-testid="timeline-dashed" />
          </div>
        </section>

        <ChronixDivider data-testid="divider-data-display-section">
          Data display (Descriptions + List)
        </ChronixDivider>

        <section className="demo-section">
          <h2>Descriptions — default / bordered / vertical / span / title / small</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <ChronixDescriptions
              items={DESCRIPTIONS_BASIC_ITEMS}
              columns={3}
              data-testid="descriptions-default"
            />
            <ChronixDescriptions
              items={DESCRIPTIONS_BASIC_ITEMS}
              columns={3}
              bordered
              data-testid="descriptions-bordered"
            />
            <ChronixDescriptions
              items={DESCRIPTIONS_BASIC_ITEMS}
              columns={3}
              labelPlacement="top"
              data-testid="descriptions-vertical"
            />
            <ChronixDescriptions
              items={DESCRIPTIONS_SPAN_ITEMS}
              columns={3}
              data-testid="descriptions-with-span"
            />
            <ChronixDescriptions
              items={DESCRIPTIONS_BASIC_ITEMS}
              columns={3}
              title="Profile"
              data-testid="descriptions-with-title"
            />
            <ChronixDescriptions
              items={DESCRIPTIONS_BASIC_ITEMS}
              columns={3}
              size="small"
              data-testid="descriptions-small"
            />
          </div>
        </section>

        <section className="demo-section">
          <h2>List — basic / bordered+hoverable / no-divider / prefix+suffix / small</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 480 }}>
            <ChronixList items={LIST_BASIC_ITEMS} data-testid="list-basic" />
            <ChronixList
              items={LIST_BASIC_ITEMS}
              bordered
              hoverable
              data-testid="list-bordered-hoverable"
            />
            <ChronixList
              items={LIST_BASIC_ITEMS}
              showDivider={false}
              data-testid="list-no-divider"
            />
            <ChronixList items={LIST_RICH_ITEMS} bordered data-testid="list-with-prefix-suffix" />
            <ChronixList items={LIST_BASIC_ITEMS} size="small" data-testid="list-small" />
          </div>
        </section>

        <ChronixDivider data-testid="divider-visual-artifacts-section">
          Visual artifacts (Watermark + QrCode + Marquee)
        </ChronixDivider>

        <section className="demo-section">
          <h2>Watermark — default / rotated / large tile</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <ChronixWatermark data-testid="watermark-default">
              <div style={{ padding: 32, background: '#fafafa', minHeight: 120 }}>
                Default watermark wrapping arbitrary content.
              </div>
            </ChronixWatermark>
            <ChronixWatermark
              content="DRAFT"
              rotate={-30}
              opacity={0.25}
              color="#d03050"
              data-testid="watermark-rotated"
            >
              <div style={{ padding: 32, background: '#fff', minHeight: 120 }}>
                -30° red DRAFT watermark.
              </div>
            </ChronixWatermark>
            <ChronixWatermark
              content="CONFIDENTIAL"
              width={320}
              height={120}
              fontSize={22}
              data-testid="watermark-large"
            >
              <div style={{ padding: 32, background: '#fafafa', minHeight: 160 }}>
                Large 320×120 tile.
              </div>
            </ChronixWatermark>
          </div>
        </section>

        <section className="demo-section">
          <h2>QrCode — default / low EC / colored / large</h2>
          <div className="demo-row" style={{ gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
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
              size={256}
              data-testid="qrcode-large"
            />
          </div>
        </section>

        <section className="demo-section">
          <h2>Marquee — left / right / up / pause-on-hover</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ChronixMarquee data-testid="marquee-default">
              <span style={{ padding: '0 32px' }}>⭐ BTC $50,000</span>
              <span style={{ padding: '0 32px' }}>📈 ETH $3,000</span>
              <span style={{ padding: '0 32px' }}>💎 SOL $150</span>
              <span style={{ padding: '0 32px' }}>🚀 DOT $20</span>
            </ChronixMarquee>
            <ChronixMarquee direction="right" data-testid="marquee-right">
              <span style={{ padding: '0 24px' }}>→ news headline 1</span>
              <span style={{ padding: '0 24px' }}>→ news headline 2</span>
              <span style={{ padding: '0 24px' }}>→ news headline 3</span>
            </ChronixMarquee>
            <div
              style={{
                height: 120,
                display: 'flex',
                alignItems: 'stretch',
                gap: 16,
              }}
            >
              <ChronixMarquee direction="up" data-testid="marquee-up" style={{ flex: 1 }}>
                <div style={{ padding: '8px 16px' }}>tick 1</div>
                <div style={{ padding: '8px 16px' }}>tick 2</div>
                <div style={{ padding: '8px 16px' }}>tick 3</div>
                <div style={{ padding: '8px 16px' }}>tick 4</div>
              </ChronixMarquee>
            </div>
            <ChronixMarquee pauseOnHover data-testid="marquee-pause-on-hover">
              <span style={{ padding: '0 32px' }}>hover me to pause #1</span>
              <span style={{ padding: '0 32px' }}>hover me to pause #2</span>
              <span style={{ padding: '0 32px' }}>hover me to pause #3</span>
            </ChronixMarquee>
          </div>
        </section>

        <ChronixDivider data-testid="divider-info-density-section">
          Information density (Ellipsis + Thing + Log)
        </ChronixDivider>

        <section className="demo-section">
          <h2>Ellipsis — single / multi-line / no-tooltip</h2>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              maxWidth: 360,
            }}
          >
            <ChronixEllipsis content={ELLIPSIS_LONG_CONTENT} data-testid="ellipsis-single" />
            <ChronixEllipsis
              content={ELLIPSIS_LONG_CONTENT}
              lineClamp={2}
              data-testid="ellipsis-multi-line"
            />
            <ChronixEllipsis
              content={ELLIPSIS_LONG_CONTENT}
              tooltip={false}
              data-testid="ellipsis-no-tooltip"
            />
          </div>
        </section>

        <section className="demo-section">
          <h2>Thing — basic / avatar / full / indented</h2>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              maxWidth: 480,
            }}
          >
            <ChronixThing
              title="Project A"
              description="A short summary of the project status."
              data-testid="thing-basic"
            >
              <p>Body content describing the project in more detail.</p>
            </ChronixThing>
            <ChronixThing
              title="With avatar"
              description="Sub-text"
              avatar={<span style={{ fontSize: 28 }}>👤</span>}
              data-testid="thing-with-avatar"
            />
            <ChronixThing
              title="Notification"
              description="A multi-slot card with every slot populated."
              avatar={<span style={{ fontSize: 28 }}>🔔</span>}
              headerExtra={<small>2m ago</small>}
              action={
                <>
                  <ChronixButton variant="primary">Reply</ChronixButton>
                  <ChronixButton>Dismiss</ChronixButton>
                </>
              }
              footer="From: alice@chronix.dev"
              data-testid="thing-full"
            >
              <p>This is the body content. It spans the full width of the main column.</p>
            </ChronixThing>
            <ChronixThing
              title="Indented content"
              description="Avatar with indented body"
              avatar={<span style={{ fontSize: 28 }}>📝</span>}
              contentIndented
              data-testid="thing-indented"
            >
              <p>Body content aligns past the avatar column.</p>
            </ChronixThing>
          </div>
        </section>

        <section className="demo-section">
          <h2>Log — basic / line-numbers / loading / max-height</h2>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              maxWidth: 560,
            }}
          >
            <ChronixLog lines={LOG_BASIC_LINES} data-testid="log-basic" />
            <ChronixLog lines={LOG_BASIC_LINES} lineNumbers data-testid="log-with-line-numbers" />
            <ChronixLog lines={LOG_BASIC_LINES} loading data-testid="log-loading" />
            <ChronixLog
              lines={LOG_LONG_LINES}
              lineNumbers
              maxHeight={200}
              data-testid="log-max-height"
            />
          </div>
        </section>

        <ChronixDivider data-testid="divider-tier-a-finale-section">
          Tier A finale (12 components)
        </ChronixDivider>

        <section className="demo-section">
          <h2>ButtonGroup / Element / Typography / Code</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ChronixButtonGroup data-testid="phase24-button-group">
              <ChronixButton>One</ChronixButton>
              <ChronixButton>Two</ChronixButton>
              <ChronixButton>Three</ChronixButton>
            </ChronixButtonGroup>
            <ChronixElement tag="section" data-testid="phase24-element">
              Element as &lt;section&gt;
            </ChronixElement>
            <ChronixTypography variant="title" level={3} data-testid="phase24-typography">
              Typography h3 title
            </ChronixTypography>
            <ChronixCode value={'const x = 1 + 2;\nconsole.log(x);'} data-testid="phase24-code" />
          </div>
        </section>

        <section className="demo-section">
          <h2>GradientText / Highlight</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ChronixGradientText
              value="Rainbow gradient text"
              data-testid="phase24-gradient-text"
            />
            <ChronixHighlight
              value="The quick brown fox jumps over the lazy dog"
              pattern="quick"
              data-testid="phase24-highlight"
            />
          </div>
        </section>

        <section className="demo-section">
          <h2>Avatar / AvatarGroup / IconWrapper / Icon</h2>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 24,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <ChronixAvatar text="AB" data-testid="phase24-avatar" />
            <ChronixAvatarGroup
              items={AVATAR_GROUP_ITEMS}
              max={5}
              data-testid="phase24-avatar-group"
            />
            <ChronixIconWrapper size={32} color="#3b82f6" data-testid="phase24-icon-wrapper">
              <ChronixIcon name="check" size={32} />
            </ChronixIconWrapper>
            <ChronixIcon name="check" size={24} data-testid="phase24-icon" />
          </div>
        </section>

        <section className="demo-section">
          <h2>Equation / Heatmap</h2>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 32,
              alignItems: 'flex-start',
              flexWrap: 'wrap',
            }}
          >
            <ChronixEquation
              value="<mrow><mi>E</mi><mo>=</mo><mi>m</mi><msup><mi>c</mi><mn>2</mn></msup></mrow>"
              display="block"
              data-testid="phase24-equation"
            />
            <ChronixHeatmap cells={HEATMAP_CELLS} cellSize={24} data-testid="phase24-heatmap" />
          </div>
        </section>

        <ChronixDivider data-testid="divider-tier-b-form-inputs-section">
          Tier B form inputs (8 components)
        </ChronixDivider>

        <section className="demo-section">
          <h2>Input + InputOtp</h2>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              maxWidth: 360,
            }}
          >
            <ChronixInput
              value={phase25InputText}
              placeholder="Type something"
              data-testid="phase25-input"
              onChange={setPhase25InputText}
            />
            <ChronixInput
              value={phase25InputTextarea}
              type="textarea"
              rows={3}
              data-testid="phase25-input-textarea"
              onChange={setPhase25InputTextarea}
            />
            <ChronixInput
              value={phase25InputClearable}
              clearable
              data-testid="phase25-input-clearable"
              onChange={setPhase25InputClearable}
            />
            <ChronixInputOtp
              value={phase25Otp}
              length={6}
              data-testid="phase25-input-otp"
              onChange={setPhase25Otp}
            />
          </div>
        </section>

        <section className="demo-section">
          <h2>Checkbox + Switch</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <ChronixCheckbox
              checked={phase25CheckboxChecked}
              label="Accept terms"
              data-testid="phase25-checkbox"
              onChange={setPhase25CheckboxChecked}
            />
            <ChronixCheckbox
              checked
              indeterminate
              label="Parent of selection"
              data-testid="phase25-checkbox-indeterminate"
            />
            <ChronixSwitch
              checked={phase25SwitchChecked}
              data-testid="phase25-switch"
              onChange={setPhase25SwitchChecked}
            />
          </div>
        </section>

        <section className="demo-section">
          <h2>Radio + Rate + InputNumber</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <ChronixRadioGroup
              value={phase25RadioValue}
              options={PHASE25_RADIO_OPTIONS}
              data-testid="phase25-radio-group"
              onChange={setPhase25RadioValue}
            />
            <ChronixRate value={phase25Rate} data-testid="phase25-rate" onChange={setPhase25Rate} />
            <ChronixRate
              value={phase25RateHalf}
              allowHalf
              data-testid="phase25-rate-half"
              onChange={setPhase25RateHalf}
            />
            <ChronixInputNumber
              value={phase25NumberValue}
              min={0}
              max={100}
              step={5}
              data-testid="phase25-input-number"
              onChange={setPhase25NumberValue}
            />
          </div>
        </section>

        <section className="demo-section">
          <h2>AutoComplete</h2>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              maxWidth: 360,
            }}
          >
            <ChronixAutoComplete
              value={phase25AutoCompleteValue}
              options={PHASE25_AUTOCOMPLETE_OPTIONS}
              placeholder="Type a state name"
              data-testid="phase25-autocomplete"
              onChange={setPhase25AutoCompleteValue}
            />
          </div>
        </section>

        <ChronixDivider data-testid="divider-popover-infra-section">
          Popover infrastructure (4 components)
        </ChronixDivider>

        <section className="demo-section">
          <h2>Popover + Tooltip (show=true demo)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 80, marginTop: 60 }}>
            <ChronixPopover
              show
              trigger="manual"
              placement="bottom"
              flip={false}
              content="Popover body content"
              data-testid="phase26-popover"
            >
              <ChronixButton>Popover anchor</ChronixButton>
            </ChronixPopover>
            <ChronixTooltip
              show
              trigger="manual"
              placement="top"
              flip={false}
              content="Tooltip text"
              data-testid="phase26-tooltip"
            >
              <ChronixButton>Tooltip anchor</ChronixButton>
            </ChronixTooltip>
          </div>
        </section>

        <section className="demo-section">
          <h2>Popconfirm + PopSelect (show=true demo)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 100, marginTop: 80 }}>
            <ChronixPopconfirm
              show
              trigger="manual"
              placement="top"
              flip={false}
              title="Delete this item?"
              positiveText="Delete"
              negativeText="Keep"
              data-testid="phase26-popconfirm"
            >
              <ChronixButton>Popconfirm anchor</ChronixButton>
            </ChronixPopconfirm>
            <ChronixPopSelect
              show
              trigger="manual"
              placement="bottom-start"
              flip={false}
              options={PHASE26_POP_SELECT_OPTIONS}
              value={phase26PopSelectValue}
              data-testid="phase26-pop-select"
              onChange={setPhase26PopSelectValue}
            >
              <ChronixButton>PopSelect anchor</ChronixButton>
            </ChronixPopSelect>
          </div>
        </section>

        <ChronixDivider titlePlacement="left">
          Popover-consuming Tier B (6 components)
        </ChronixDivider>

        <section className="demo-section">
          <h2>Modal + Drawer (click to open)</h2>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <ChronixButton
              data-testid="phase27-modal-toggle"
              onClick={() => setPhase27ModalShow(true)}
            >
              Open Modal
            </ChronixButton>
            <ChronixButton
              data-testid="phase27-drawer-toggle"
              onClick={() => setPhase27DrawerShow(true)}
            >
              Open Drawer
            </ChronixButton>
          </div>
          <ChronixModal
            show={phase27ModalShow}
            title="Confirm action"
            width={360}
            data-testid="phase27-modal"
            onShowChange={setPhase27ModalShow}
            footer={
              <>
                <ChronixButton onClick={() => setPhase27ModalShow(false)}>Cancel</ChronixButton>
                <ChronixButton variant="primary" onClick={() => setPhase27ModalShow(false)}>
                  Confirm
                </ChronixButton>
              </>
            }
          >
            Modal body content.
          </ChronixModal>
          <ChronixDrawer
            show={phase27DrawerShow}
            placement="right"
            title="Drawer right"
            width={280}
            data-testid="phase27-drawer"
            onShowChange={setPhase27DrawerShow}
          >
            Drawer body content.
          </ChronixDrawer>
        </section>

        <section className="demo-section">
          <h2>Dropdown + Menu</h2>
          <div style={{ display: 'flex', gap: 60, alignItems: 'flex-start', marginTop: 40 }}>
            <ChronixDropdown
              show
              trigger="manual"
              placement="bottom-start"
              options={PHASE27_DROPDOWN_OPTIONS}
              data-testid="phase27-dropdown"
            >
              <ChronixButton>Dropdown anchor</ChronixButton>
            </ChronixDropdown>
            <ChronixMenu
              value="analytics.dashboard"
              items={PHASE27_MENU_ITEMS}
              mode="vertical"
              data-testid="phase27-menu"
            />
          </div>
        </section>

        <section className="demo-section">
          <h2>Affix + BackTop</h2>
          <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start' }}>
            <ChronixAffix top={0} data-testid="phase27-affix">
              <ChronixButton>Pinned-to-top content</ChronixButton>
            </ChronixAffix>
            <ChronixBackTop
              visibilityThreshold={0}
              right={40}
              bottom={40}
              data-testid="phase27-back-top"
            />
          </div>
        </section>

        <ChronixDivider titlePlacement="left">Layout family (8 components)</ChronixDivider>

        <section className="demo-section">
          <h2>Layout shell (header + sider + content + footer)</h2>
          <div style={{ border: '1px solid #d1d5db', height: 200 }}>
            <ChronixLayout data-testid="phase28-layout">
              <ChronixLayoutSider width={140} />
              <ChronixLayout>
                <ChronixLayoutHeader>Header</ChronixLayoutHeader>
                <ChronixLayoutContent>Content body</ChronixLayoutContent>
                <ChronixLayoutFooter>Footer</ChronixLayoutFooter>
              </ChronixLayout>
            </ChronixLayout>
          </div>
        </section>

        <section className="demo-section">
          <h2>Tabs</h2>
          <ChronixTabs
            value={phase28TabValue}
            items={PHASE28_TAB_ITEMS}
            onValueChange={setPhase28TabValue}
            data-testid="phase28-tabs"
          />
        </section>

        <section className="demo-section">
          <h2>Collapse + CollapseTransition</h2>
          <ChronixCollapse
            value={phase28CollapseValue}
            items={PHASE28_COLLAPSE_ITEMS}
            onValueChange={(v) => setPhase28CollapseValue((v ?? []) as readonly string[])}
            data-testid="phase28-collapse"
          />
          <div style={{ marginTop: 16 }}>
            <ChronixCollapseTransition show data-testid="phase28-collapse-transition">
              <div style={{ padding: 12, border: '1px solid #d1d5db' }}>
                Direct CollapseTransition consumer (always expanded).
              </div>
            </ChronixCollapseTransition>
          </div>
        </section>

        <section className="demo-section">
          <h2>Split + Image</h2>
          <div style={{ height: 140, border: '1px solid #d1d5db' }}>
            <ChronixSplit
              data-testid="phase28-split"
              first={<div style={{ padding: 12 }}>Pane A</div>}
              second={<div style={{ padding: 12 }}>Pane B</div>}
            />
          </div>
          <div style={{ marginTop: 16 }}>
            <ChronixImage
              src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='100'%3E%3Crect width='160' height='100' fill='%232563eb'/%3E%3C/svg%3E"
              width={160}
              height={100}
              data-testid="phase28-image"
            />
          </div>
        </section>

        <section className="demo-section">
          <h2>FloatButton + FloatButtonGroup</h2>
          <div style={{ position: 'relative', height: 120, border: '1px dashed #9ca3af' }}>
            <ChronixFloatButton
              description="A"
              right={200}
              bottom={200}
              data-testid="phase28-float-button"
            />
            <ChronixFloatButtonGroup
              right={100}
              bottom={200}
              data-testid="phase28-float-button-group"
            >
              <ChronixFloatButton description="1" right={0} bottom={0} />
              <ChronixFloatButton description="2" right={0} bottom={0} />
            </ChronixFloatButtonGroup>
          </div>
        </section>

        <ChronixDivider titlePlacement="left">Tier B remainder (3 components)</ChronixDivider>

        <section className="demo-section">
          <h2>Carousel</h2>
          <ChronixCarousel
            value={phase29CarouselValue}
            items={PHASE29_CAROUSEL_ITEMS}
            autoplay={false}
            onValueChange={setPhase29CarouselValue}
            data-testid="phase29-carousel"
          />
        </section>

        <section className="demo-section">
          <h2>Wave (click the button to ripple)</h2>
          <ChronixWave data-testid="phase29-wave">
            <ChronixButton>Click me</ChronixButton>
          </ChronixWave>
        </section>

        <section className="demo-section">
          <h2>FocusDetector (focus the input to fire events)</h2>
          <ChronixFocusDetector data-testid="phase29-focus-detector">
            <input type="text" placeholder="Focus to fire chronix focus event" />
          </ChronixFocusDetector>
        </section>

        <ChronixDivider titlePlacement="left">Tier C Tree (1 component)</ChronixDivider>

        <section className="demo-section">
          <h2>Tree (single-select, one branch expanded)</h2>
          <ChronixTree
            value={phase30TreeValue}
            items={PHASE30_TREE_ITEMS}
            expandedKeys={phase30TreeExpandedKeys}
            onValueChange={setPhase30TreeValue}
            onExpandedKeysChange={(keys) => setPhase30TreeExpandedKeys(Array.from(keys))}
            data-testid="phase30-tree"
          />
        </section>

        <section className="demo-section">
          <h2>Tree (virtual mode — 50 nodes, height 200)</h2>
          <ChronixTree
            value={phase30VirtualTreeValue}
            items={PHASE30_VIRTUAL_TREE_ITEMS}
            virtual
            virtualItemHeight={28}
            height={200}
            onValueChange={setPhase30VirtualTreeValue}
            data-testid="phase30-tree-virtual"
          />
        </section>

        <ChronixDivider titlePlacement="left">Tier C Select family (4 components)</ChronixDivider>

        <section className="demo-section">
          <h2>Select (single)</h2>
          <ChronixSelect
            options={PHASE31_SELECT_OPTIONS}
            value={phase31SelectValue}
            onChange={(v: string | string[]) => setPhase31SelectValue(v as string)}
            placeholder="Select..."
            data-testid="phase31-select"
          />
        </section>

        <section className="demo-section">
          <h2>Select (multiple)</h2>
          <ChronixSelect
            options={PHASE31_SELECT_OPTIONS}
            value={phase31SelectMultiValue}
            multiple
            onChange={(v: string | string[]) => setPhase31SelectMultiValue(v as string[])}
            placeholder="Select..."
            data-testid="phase31-select-multi"
          />
        </section>

        <section className="demo-section">
          <h2>TreeSelect</h2>
          <ChronixTreeSelect
            data={PHASE31_TREE_DATA}
            value={phase31TreeSelectValue}
            expandedKeys={phase31TreeSelectExpandedKeys}
            onChange={(v: string | string[]) => setPhase31TreeSelectValue(v as string)}
            onExpandedKeysChange={(keys: string[]) => setPhase31TreeSelectExpandedKeys(keys)}
            placeholder="Select node..."
            data-testid="phase31-tree-select"
          />
        </section>

        <section className="demo-section">
          <h2>Cascader</h2>
          <ChronixCascader
            options={PHASE31_CASCADER_OPTIONS}
            value={phase31CascaderValue}
            onChange={(v: string | string[]) => setPhase31CascaderValue(v as string)}
            placeholder="Select..."
            data-testid="phase31-cascader"
          />
        </section>

        <section className="demo-section">
          <h2>Mention (type @ in textarea)</h2>
          <ChronixMention
            options={PHASE31_MENTION_OPTIONS}
            value={phase31MentionValue}
            onChange={(v: string) => setPhase31MentionValue(v)}
            placeholder="Type @ to mention..."
            data-testid="phase31-mention"
          />
        </section>

        <ChronixDivider titlePlacement="left">
          DatePicker / TimePicker / Calendar (3 components)
        </ChronixDivider>

        <section className="demo-section">
          <h2>DatePicker</h2>
          <ChronixDatePicker
            value={phase32DatePickerValue}
            onChange={setPhase32DatePickerValue}
            placeholder="Pick a date"
            format="yyyy-MM-dd"
            data-testid="phase32-date-picker"
          />
        </section>

        <section className="demo-section">
          <h2>TimePicker</h2>
          <ChronixTimePicker
            value={phase32TimePickerValue}
            onChange={setPhase32TimePickerValue}
            placeholder="Pick time"
            format="HH:mm:ss"
            data-testid="phase32-time-picker"
          />
        </section>

        <section className="demo-section">
          <h2>Calendar</h2>
          <ChronixCalendar
            value={phase32CalendarValue}
            onChange={setPhase32CalendarValue}
            data-testid="phase32-calendar"
          />
        </section>

        <ChronixDivider titlePlacement="left">
          ColorPicker / Transfer / Slider / Pagination (4 components)
        </ChronixDivider>

        <section className="demo-section">
          <h2>ColorPicker</h2>
          <ChronixColorPicker
            value={phase33ColorPickerValue}
            onChange={setPhase33ColorPickerValue}
            swatches={['#ff0000', '#00ff00', '#0000ff', '#ffff00']}
            data-testid="phase33-color-picker"
          />
        </section>

        <section className="demo-section">
          <h2>Transfer</h2>
          <ChronixTransfer
            value={phase33TransferValue}
            onChange={setPhase33TransferValue}
            options={[
              { label: 'Apple', value: 'a' },
              { label: 'Banana', value: 'b' },
              { label: 'Cherry', value: 'c' },
              { label: 'Date', value: 'd' },
            ]}
            filterable
            data-testid="phase33-transfer"
          />
        </section>

        <section className="demo-section">
          <h2>Slider</h2>
          <ChronixSlider
            value={phase33SliderValue}
            onChange={setPhase33SliderValue}
            min={0}
            max={100}
            data-testid="phase33-slider"
          />
        </section>

        <section className="demo-section">
          <h2>Pagination</h2>
          <ChronixPagination
            page={phase33PaginationPage}
            onChange={setPhase33PaginationPage}
            pageCount={10}
            data-testid="phase33-pagination"
          />
        </section>

        <section className="demo-section">
          <h2>Form</h2>
          <ChronixForm
            model={phase34Model}
            rules={{
              name: { required: true, message: 'Name is required' },
              email: { type: 'email', message: 'Invalid email' },
            }}
            labelPlacement="left"
            labelWidth={80}
            data-testid="phase34-form"
          >
            <ChronixFormItem label="Name" path="name">
              <input
                value={(phase34Model['name'] as string) ?? ''}
                onChange={(e) =>
                  setPhase34Model({
                    ...phase34Model,
                    ['name']: e.target.value,
                  })
                }
                placeholder="Name"
                data-testid="phase34-input-name"
              />
            </ChronixFormItem>
            <ChronixFormItem label="Email" path="email">
              <input
                value={(phase34Model['email'] as string) ?? ''}
                onChange={(e) =>
                  setPhase34Model({
                    ...phase34Model,
                    ['email']: e.target.value,
                  })
                }
                placeholder="Email"
                data-testid="phase34-input-email"
              />
            </ChronixFormItem>
          </ChronixForm>
        </section>

        <ChronixDivider titlePlacement="left">
          DynamicInput / DynamicTags / Anchor / NumberAnimation / Scrollbar / Upload
        </ChronixDivider>

        <section className="demo-section">
          <h2>DynamicInput</h2>
          <ChronixDynamicInput
            value={phase35DynamicInputValue}
            onChange={setPhase35DynamicInputValue}
            data-testid="phase35-dynamic-input"
          />
        </section>

        <section className="demo-section">
          <h2>DynamicTags</h2>
          <ChronixDynamicTags
            value={phase35DynamicTagsValue}
            onChange={setPhase35DynamicTagsValue}
            data-testid="phase35-dynamic-tags"
          />
        </section>

        <section className="demo-section">
          <h2>Anchor</h2>
          <ChronixAnchor
            items={[
              { key: 'a', label: 'Section A', href: '#a' },
              { key: 'b', label: 'Section B', href: '#b' },
            ]}
            data-testid="phase35-anchor"
          />
        </section>

        <section className="demo-section">
          <h2>NumberAnimation</h2>
          <ChronixNumberAnimation
            from={0}
            to={phase35NumberAnimationTo}
            duration={1000}
            data-testid="phase35-number-animation"
          />
        </section>

        <section className="demo-section">
          <h2>Scrollbar</h2>
          <ChronixScrollbar data-testid="phase35-scrollbar">
            <div style={{ height: 200 }}>Scrollable content</div>
          </ChronixScrollbar>
        </section>

        <section className="demo-section">
          <h2>Upload</h2>
          <ChronixUpload action="#" fileList={phase35UploadFiles} data-testid="phase35-upload" />
        </section>

        <ChronixDivider titlePlacement="left">
          Carousel lazy + thumbnails / Tabs editable / Mention multi-source
        </ChronixDivider>

        <section className="demo-section">
          <h2>Carousel (lazy + thumbnails)</h2>
          <ChronixCarousel
            items={PHASE37_LAZY_CAROUSEL_ITEMS}
            value={phase37LazyCarouselValue}
            lazy
            thumbnails
            onValueChange={setPhase37LazyCarouselValue}
            data-testid="phase37-carousel-lazy"
          />
        </section>

        <section className="demo-section">
          <h2>Tabs (closable + addable + draggable)</h2>
          <ChronixTabs
            items={PHASE37_TAB_ITEMS}
            value={phase37TabsValue}
            addable
            draggable
            onValueChange={setPhase37TabsValue}
            data-testid="phase37-tabs-editable"
          />
        </section>

        <section className="demo-section">
          <h2>Mention (multi-source @ #)</h2>
          <ChronixMention
            value={phase37MentionValue}
            sources={PHASE37_MENTION_SOURCES}
            onChange={setPhase37MentionValue}
            data-testid="phase37-mention-multi"
          />
        </section>
      </div>
    </ChronixUIProvider>
  );
}
