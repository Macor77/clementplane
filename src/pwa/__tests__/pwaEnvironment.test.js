import { describe, expect, it } from 'vitest';
import {
  INSTALL_HINT_COOLDOWN_MS,
  getAccessMode,
  isIosDevice,
  isMobileDevice,
  isStandalone,
  shouldShowInstallHint,
} from '../pwaEnvironment.js';

describe('PWA environment decisions', () => {
  it('detects Android and iOS mobile browsers', () => {
    expect(isMobileDevice({ userAgent: 'Mozilla/5.0 (Linux; Android 15; SM-S928B) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36' })).toBe(true);
    expect(isMobileDevice({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)' })).toBe(true);
    expect(isMobileDevice({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' })).toBe(false);
  });

  it('detects iPhone/iPad user agents', () => {
    expect(isIosDevice({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', platform: 'iPhone', maxTouchPoints: 5 })).toBe(true);
    expect(isIosDevice({ userAgent: 'Mozilla/5.0 (Linux; Android 15)', platform: 'Linux armv8l', maxTouchPoints: 5 })).toBe(false);
  });

  it('detects standalone through display-mode or iOS navigator.standalone', () => {
    expect(isStandalone({ matchMedia: () => ({ matches: true }) }, {})).toBe(true);
    expect(isStandalone({ matchMedia: () => ({ matches: false }) }, { standalone: true })).toBe(true);
  });

  it('classifies each authenticated app opening as pwa or browser', () => {
    expect(getAccessMode({ matchMedia: () => ({ matches: true }) }, {})).toBe('pwa');
    expect(getAccessMode({ matchMedia: () => ({ matches: false }) }, {})).toBe('browser');
  });

  it('keeps a dismissed install hint quiet for seven days', () => {
    const now = Date.UTC(2026, 7, 27);
    expect(INSTALL_HINT_COOLDOWN_MS).toBe(7 * 24 * 60 * 60 * 1000);
    expect(shouldShowInstallHint({ installed: false, dismissedAt: now - 1000, now, cooldownMs: INSTALL_HINT_COOLDOWN_MS })).toBe(false);
    expect(shouldShowInstallHint({ installed: false, dismissedAt: now - INSTALL_HINT_COOLDOWN_MS - 1, now, cooldownMs: INSTALL_HINT_COOLDOWN_MS })).toBe(true);
  });
});
