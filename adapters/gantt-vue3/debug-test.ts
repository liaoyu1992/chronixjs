import {
  defaultAxisRangePlanner,
  defaultBarPlacementPass,
  defaultBarStackHeightPass,
  defaultLinkRouter,
  defaultRowSwimlaneLayout,
} from '@chronixjs/gantt';
import { mount } from '@vue/test-utils';
import { ChronixGantt } from './src/chronix-gantt.js';
import type { AxisRangePlanInput, BarSpec, RowSpec, LinkSpec } from '@chronixjs/gantt';

const MS_PER_HOUR = 60 * 60 * 1000;
const today = new Date('2026-05-13T00:00:00Z');
today.setHours(0, 0, 0, 0);
const todayMs = today.getTime();

function bar(id: string, rowId: string, startHour: number, endHour: number): BarSpec {
  return {
    id,
    rowId,
    range: {
      start: new Date(todayMs + startHour * MS_PER_HOUR),
      end: new Date(todayMs + endHour * MS_PER_HOUR),
    },
    dprIntent: 'crisp-pixel',
  };
}

const rows: readonly RowSpec[] = [
  { id: 'r1', columns: {} },
  { id: 'r2', columns: {} },
];

const axisInput: AxisRangePlanInput = {
  viewId: 'day',
  anchorDate: new Date('2026-05-13T00:00:00Z'),
  viewportWidth: 1440,
  locale: 'zh-CN',
  weekendsVisible: true,
};

const twoBars: readonly BarSpec[] = [bar('b1', 'r1', 1, 4), bar('b2', 'r2', 8, 12)];
const links: readonly LinkSpec[] = [
  { id: 'link-1', fromBarId: 'b1', toBarId: 'b2', routing: 'square', marker: 'arrow' },
];

const wrapper = mount(ChronixGantt, {
  props: { bars: twoBars, rows, axisInput, links },
});

const bodySvg = wrapper.find('svg.cx-gantt-body').element;
const directGroups = Array.from(bodySvg.children).filter(
  (n): n is Element => n.nodeType === 1 && n.tagName.toLowerCase() === 'g',
);

console.log('Direct groups:');
directGroups.forEach((g, i) => {
  const classes = Array.from(g.classList);
  console.log(`  [${i}] class="${classes.join(' ')}"`);
});

const barsIdx = directGroups.findIndex((g) => g.classList.contains('cx-gantt-bars'));
const linksIdx = directGroups.findIndex((g) => g.classList.contains('cx-gantt-links'));
console.log(`barsIdx=${barsIdx}, linksIdx=${linksIdx}, linksIdx > barsIdx = ${linksIdx > barsIdx}`);
