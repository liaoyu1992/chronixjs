export interface VisualScenario {
  id: string;
  description: string;
  setup?: (api: ScenarioApi) => Promise<void>;
}

export interface ScenarioApi {
  pickTimelineScale: (label: string) => Promise<void>;
  waitForChartReady: () => Promise<void>;
}

export const VISUAL_SCENARIOS: VisualScenario[] = [
  {
    id: 'week-default',
    description: 'Default load: zh-CN locale, week scale, weekends visible, full event set with dependency lines',
  },
];
