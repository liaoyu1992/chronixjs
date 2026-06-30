/**
 * Time unit generation — .
 *
 * Generates hour/minute/second value lists with step support.
 * Used by TimePicker adapter to render scrollable columns.
 */

export interface TimeUnits {
  readonly hours: readonly number[];
  readonly minutes: readonly number[];
  readonly seconds: readonly number[];
}

export interface GenerateTimeUnitsOptions {
  readonly hourStep: number;
  readonly minuteStep: number;
  readonly secondStep: number;
  readonly use12Hours: boolean;
}

/**
 * Generate filtered lists of hour, minute, second values
 * based on step configuration.
 */
export function generateTimeUnits(options: GenerateTimeUnitsOptions): TimeUnits {
  const { hourStep, minuteStep, secondStep, use12Hours } = options;

  const maxHour = use12Hours ? 13 : 24;
  const startHour = use12Hours ? 1 : 0;

  const hours: number[] = [];
  for (let h = startHour; h < maxHour; h += Math.max(1, hourStep)) {
    hours.push(h);
  }

  const minutes: number[] = [];
  for (let m = 0; m < 60; m += Math.max(1, minuteStep)) {
    minutes.push(m);
  }

  const seconds: number[] = [];
  for (let s = 0; s < 60; s += Math.max(1, secondStep)) {
    seconds.push(s);
  }

  return { hours, minutes, seconds };
}

/**
 * Find the nearest valid time value for a given unit list.
 * Used when the current value doesn't align with the step.
 */
export function findNearestTimeValue(current: number, values: readonly number[]): number {
  if (values.length === 0) return current;
  let nearest = values[0]!;
  let minDist = Math.abs(current - nearest);
  for (let i = 1; i < values.length; i++) {
    const dist = Math.abs(current - values[i]!);
    if (dist < minDist) {
      minDist = dist;
      nearest = values[i]!;
    }
  }
  return nearest;
}
