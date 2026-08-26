import test from 'node:test';
import assert from 'node:assert/strict';
import { isMobileNavigationCloseKey } from '../mobileNavigation.js';

test('Escape ferme la navigation mobile', () => {
  assert.equal(isMobileNavigationCloseKey('Escape'), true);
});

test('les autres touches ne ferment pas la navigation mobile', () => {
  assert.equal(isMobileNavigationCloseKey('Enter'), false);
  assert.equal(isMobileNavigationCloseKey(' '), false);
});
