export interface VisualScenario {
  id: string;
  description: string;
  /**
   * If set, click the headerToolbar button with this exact text label before screenshot.
   * Lets us cover the demo's 6 timeline scales without per-scenario imperative code.
   */
  viewToggleLabel?: string;
}

export const VISUAL_SCENARIOS: VisualScenario[] = [
  {
    id: 'week-default',
    description:
      'Default load: zh-CN locale, week scale, weekends visible, full event set with dependency lines',
  },
  {
    id: 'view-day',
    description: 'Day-scale view (hourly slots × single day)',
    viewToggleLabel: '日',
  },
  {
    id: 'view-month',
    description: 'Month-scale view (one month span)',
    viewToggleLabel: '月',
  },
  {
    id: 'view-season',
    description: 'Season-scale view (3-month span)',
    viewToggleLabel: '季',
  },
  {
    id: 'view-half-year',
    description: 'Half-year-scale view (6-month span)',
    viewToggleLabel: '半年',
  },
  {
    id: 'view-year',
    description: 'Year-scale view (12-month span)',
    viewToggleLabel: '年',
  },
];
