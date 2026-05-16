/**
 * **Single source of truth for the cross-demo parity dataset.**
 *
 * Both the chronix demo (when loaded with `?parity=true`) AND the
 * Playwright parity tests (in `tests/parity.spec.ts`) consume this
 * module. Keeping the dataset in one place eliminates the drift risk
 * that would arise if the chronix demo and the test fixture each
 * carried their own copy of "the 25 events used for cross-demo
 * comparison".
 *
 * Why this lives under `tooling/golden-runner/src/`:
 * - The dataset is a TESTING fixture, not chronix application code —
 *   chronix's published API surface (`@chronixjs/gantt`,
 *   `@chronixjs/gantt-vue3`) doesn't ship it.
 * - The chronix demo workspace already depends on
 *   `@chronixjs/golden-runner` transitively (via parity-mode loading
 *   the dataset), which is acceptable because example workspaces are
 *   not published to npm.
 *
 * The data mirrors the k-ui demo's `generateTestEvents()` at
 * `examples/gantt/vue3/src/DemoApp.vue:691-1271` plus the 32-resource
 * `RESOURCES[]` array at `DemoApp.vue:23-410`. Only the geometry-
 * relevant fields (id, resourceId, start/end epoch math) are
 * mirrored; styling fields (backgroundColor, dependencies,
 * extendedProps) are NOT in scope because chronix v0 parity only
 * compares observable geometry (x / width / y / height).
 */

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

/**
 * The 32 resource ids in the k-ui demo's `RESOURCES[]` array order
 * (NOT the rendered order, which differs because k-ui groups by
 * `baseName` for the left panel display).
 *
 * Chronix v0 parity mode emits rows in this order, accepting that
 * the rendered Y position will NOT match k-ui's because chronix
 * doesn't replicate the baseName grouping. Cross-demo Y parity is
 * parked until a resource-hierarchy row sorter lands.
 */
export const PARITY_RESOURCE_IDS: readonly string[] = [
  '32',
  '25',
  '16',
  '17',
  '30',
  '23',
  '19',
  '20',
  '24',
  '22',
  '18',
  '26',
  '29',
  '21',
  '28',
  '31',
  '27',
  '33',
  '3',
  '4',
  '5',
  '6',
  '2',
  '7',
  '8',
  '14',
  '15',
  '13',
  '9',
  '10',
  '11',
  '12',
];

export interface ParityEvent {
  readonly id: string;
  readonly resourceId: string;
  readonly startMs: number;
  readonly endMs: number;
  /** 0..100 progress percentage; undefined when k-ui demo's event has no progress field. */
  readonly progressValue?: number;
  /**
   * Phase 28.2: bar title text. Mirrors the k-ui demo's per-event
   * `title` field at `examples/gantt/vue3/src/DemoApp.vue:691-1271`
   * so cross-demo content parity (Set of truncated text contents)
   * holds. Always present — every event in `generateTestEvents()`
   * carries a title.
   */
  readonly title: string;
}

/**
 * Returns ms epoch for `todayMs + dayOffset days + hour:minute`,
 * mirroring the k-ui demo's
 * `formatDateTime(addDays(today, N), H, M)` chain at the epoch
 * level — avoids the `YYYY-MM-DD HH:mm:ss` string roundtrip that
 * would re-parse through `new Date(...)` and pick up the local
 * timezone a second time.
 */
function eventEpoch(todayMs: number, dayOffset: number, hour: number, minute = 0): number {
  return todayMs + dayOffset * MS_PER_DAY + hour * MS_PER_HOUR + minute * 60 * 1000;
}

/**
 * Build the 25-event parity dataset anchored at `todayMs` (local
 * midnight). Each entry corresponds to one event in the k-ui demo's
 * `generateTestEvents()` output; the (id, resourceId, startMs, endMs)
 * fields are the cross-demo identity tuple. Progress values mirror
 * the k-ui demo's progress fields where present.
 */
export function buildParityEvents(todayMs: number): readonly ParityEvent[] {
  const E = (
    id: string,
    resourceId: string,
    title: string,
    sd: number,
    sh: number,
    ed: number,
    eh: number,
    progressValue?: number,
    sm = 0,
    em = 0,
  ): ParityEvent => ({
    id,
    resourceId,
    title,
    startMs: eventEpoch(todayMs, sd, sh, sm),
    endMs: eventEpoch(todayMs, ed, eh, em),
    ...(progressValue !== undefined ? { progressValue } : {}),
  });
  // Titles mirror `examples/gantt/vue3/src/DemoApp.vue:691-1271`
  // event-by-event so cross-demo content parity (Phase 28.2) holds.
  return [
    E('event-1', '32', 'A33机型-大修项目-阶段1', -5, 8, -2, 18, 60),
    E('event-2', '25', 'A33-发动机检查', -3, 9, +1, 17, 40),
    E('event-3', '25', 'A33-起落架维护', +2, 8, +5, 16, 0),
    E('event-4', '16', 'A33-液压系统检修', -2, 10, +2, 15),
    E('event-5', '16', 'A33-电气系统检查', +3, 9, +7, 17),
    E('event-6', '19', 'A32-机身检查', -7, 8, -3, 18),
    E('event-7', '19', 'A32-发动机大修', -1, 9, +10, 16),
    E('event-8', '20', 'A32-73N-综合检查', 0, 8, +5, 18),
    E('event-9', '18', 'A32-航电系统升级', +1, 10, +7, 15),
    E('event-10', '21', '73M-73N-发动机更换', -5, 8, +3, 18),
    E('event-11', '21', '73M-73N-系统测试', +4, 9, +14, 17),
    E('event-12', '33', '787机型-4C检查-阶段1', -3, 8, +5, 18),
    E('event-13', '3', '73M-73N-起落架大修', -2, 9, +7, 16),
    E('event-14', '3', '73M-73N-液压系统检修', +8, 8, +20, 17),
    E('event-15', '4', '73N-发动机检查', 0, 10, +5, 15),
    E('event-16', '2', '73N-航电系统检查', +1, 9, +10, 16),
    E('event-17', '8', 'A32-73N-综合维护', -1, 8, +7, 18, 50),
    E('event-18', '9', '多机型-综合测试', +3, 10, +14, 17),
    E('event-19', '9', '多机型-最终验收', +15, 9, +30, 16),
    E('event-20', '28', '紧急维修-故障排除', -1, 14, +2, 20),
    E('event-21', '10', '紧急维修-部件更换', 0, 13, +3, 19),
    E('event-22', '31', '长期停场-定期检查', -7, 8, +20, 18),
    E('event-23', '11', '长期停场-维护保养', -5, 9, +25, 17),
    E('event-24', '27', '封存-预处理', +5, 8, +14, 16),
    E('event-25', '12', '封存-最终处理', +15, 9, +30, 17),
  ];
}
