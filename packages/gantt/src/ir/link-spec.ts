export type LinkRouting = 'square' | 'smooth';

export type LinkMarker =
  | 'arrow'
  | 'diamond'
  | 'diamond-hollow'
  | 'circle'
  | 'circle-hollow'
  | 'pointer'
  | 'plus'
  | 'none';

/** Optional user-defined marker shape, escapes the built-in `LinkMarker` set. */
export interface CustomLinkMarker {
  readonly id: string;
  readonly viewBox: string;
  readonly paths: readonly {
    readonly d: string;
    readonly fill?: string;
    readonly stroke?: string;
    readonly strokeWidth?: number;
  }[];
}

export interface LinkSpec {
  readonly id: string;
  readonly fromBarId: string;
  readonly toBarId: string;
  readonly routing: LinkRouting;
  readonly marker: LinkMarker | CustomLinkMarker;
  /** When set, overrides the chart-level dependency line color. */
  readonly colorOverride?: string;
}
