import type {
  ParseToolbarOptions,
  ToolbarInput,
  ToolbarModel,
  ToolbarWidget,
} from './toolbar-types.js';
import type { ViewId } from '../layout/types.js';

/**
 * Display label for each view button. Single-char Chinese labels
 * match the demo's existing `VIEW_TOGGLE` array verbatim
 * (`examples/gantt-vue3/src/App.vue:93-100`); per-view
 * `buttonTextOverride` localization is parked until i18n becomes a
 * phase.
 */
const VIEW_LABELS: Readonly<Record<ViewId, string>> = {
  day: '日',
  week: '周',
  month: '月',
  season: '季',
  halfYear: '半年',
  year: '年',
};

const NAV_BUTTON_NAMES = new Set(['prev', 'next', 'today'] as const);

/**
 * Parse the `headerToolbar` / `footerToolbar` string DSL into a
 * render-ready widget tree. Sections present in `input` are emitted
 * with their parsed widgets; absent sections come back as empty
 * arrays so the render layer can iterate the three section keys
 * unconditionally.
 *
 * `left` / `right` map to `start` / `end` (LTR-locked variant). When
 * both forms appear, the LTR-locked value wins for the corresponding
 * end — matches the reference's `Toolbar.tsx` precedence.
 *
 * Throws `Error` on an unknown widget name with a message naming the
 * accepted alternatives, so a typo (e.g. `'previous'`) fails loudly
 * rather than rendering an unlabeled button.
 */
export function parseToolbar(input: ToolbarInput, options: ParseToolbarOptions): ToolbarModel {
  const viewIdSet = new Set<string>(options.viewIds);

  // Map left → start, right → end, with the LTR-locked alias winning.
  const startStr = input.left ?? input.start;
  const endStr = input.right ?? input.end;
  const centerStr = input.center;

  return {
    sectionWidgets: {
      start: parseSection(startStr, viewIdSet, options),
      center: parseSection(centerStr, viewIdSet, options),
      end: parseSection(endStr, viewIdSet, options),
    },
  };
}

function parseSection(
  sectionStr: string | undefined,
  viewIdSet: ReadonlySet<string>,
  options: ParseToolbarOptions,
): readonly (readonly ToolbarWidget[])[] {
  if (!sectionStr) return [];
  return sectionStr
    .split(' ')
    .filter((groupStr) => groupStr.length > 0)
    .map((groupStr) => groupStr.split(',').map((name) => parseWidget(name, viewIdSet, options)));
}

function parseWidget(
  name: string,
  viewIdSet: ReadonlySet<string>,
  options: ParseToolbarOptions,
): ToolbarWidget {
  if (name === 'title') {
    return {
      buttonName: 'title',
      kind: 'title',
      labelText: '',
      iconSvg: null,
      isPressed: false,
    };
  }
  if (viewIdSet.has(name)) {
    const viewId = name as ViewId;
    return {
      buttonName: name,
      kind: 'view',
      labelText: VIEW_LABELS[viewId] ?? name,
      iconSvg: null,
      isPressed: viewId === options.activeViewId,
    };
  }
  if (name === 'prev' || name === 'next') {
    return {
      buttonName: name,
      kind: 'nav',
      labelText: '',
      iconSvg: name,
      isPressed: false,
    };
  }
  if (name === 'today') {
    return {
      buttonName: 'today',
      kind: 'nav',
      labelText: 'Today',
      iconSvg: null,
      isPressed: false,
    };
  }
  if (NAV_BUTTON_NAMES.has(name as 'prev' | 'next' | 'today')) {
    // Defensive — set covers prev/next/today but TS narrowing already handled them.
    throw new Error(`unreachable nav widget '${name}'`);
  }
  throw new Error(
    `Unknown toolbar widget '${name}'. Expected 'title', a view id ` +
      `(${[...viewIdSet].join('/')}), or a nav button ('prev' | 'next' | 'today').`,
  );
}
