import { describe, expect, it } from 'vitest';
import { futureIsoDate } from './testData.js';

describe('futureIsoDate', () => {
  it('retourne une date ISO YYYY-MM-DD située dans le futur', () => {
    const value = futureIsoDate(14);
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(new Date(`${value}T23:59:59Z`).getTime()).toBeGreaterThan(Date.now());
  });
});
