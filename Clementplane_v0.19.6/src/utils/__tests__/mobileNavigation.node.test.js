import { describe, expect, it } from 'vitest';
import { isMobileNavigationCloseKey } from '../mobileNavigation.js';

describe('mobile navigation', () => {
  it('Escape ferme la navigation mobile', () => {
    expect(isMobileNavigationCloseKey('Escape')).toBe(true);
  });

  it('les autres touches ne ferment pas la navigation mobile', () => {
    expect(isMobileNavigationCloseKey('Enter')).toBe(false);
    expect(isMobileNavigationCloseKey(' ')).toBe(false);
  });
});
