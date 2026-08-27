import { describe, expect, it } from 'vitest';
import { getMonthDays } from '../trainerAvailabilityMobile';

describe('getMonthDays', () => {
  it('returns only the days of the displayed month', () => {
    const days = getMonthDays(new Date(2026, 7, 15));
    expect(days).toHaveLength(31);
    expect(days[0].getDate()).toBe(1);
    expect(days[0].getMonth()).toBe(7);
    expect(days.at(-1).getDate()).toBe(31);
    expect(days.at(-1).getMonth()).toBe(7);
  });

  it('handles leap-year february', () => {
    expect(getMonthDays(new Date(2028, 1, 10))).toHaveLength(29);
  });
});
