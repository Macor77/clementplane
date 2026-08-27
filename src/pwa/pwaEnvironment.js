export const INSTALL_HINT_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

export function isIosDevice(navigatorLike = navigator) {
  const ua = navigatorLike?.userAgent || '';
  const platform = navigatorLike?.platform || '';
  const touchPoints = navigatorLike?.maxTouchPoints || 0;
  return /iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && touchPoints > 1);
}

export function isMobileDevice(navigatorLike = navigator) {
  const ua = navigatorLike?.userAgent || '';
  const platform = navigatorLike?.platform || '';
  const touchPoints = navigatorLike?.maxTouchPoints || 0;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (platform === 'MacIntel' && touchPoints > 1);
}

export function isStandalone(windowLike = window, navigatorLike = navigator) {
  return Boolean(
    windowLike?.matchMedia?.('(display-mode: standalone)')?.matches ||
    navigatorLike?.standalone === true,
  );
}

export function getAccessMode(windowLike = window, navigatorLike = navigator) {
  return isStandalone(windowLike, navigatorLike) ? 'pwa' : 'browser';
}

export function shouldShowInstallHint({
  installed,
  dismissedAt,
  now = Date.now(),
  cooldownMs = INSTALL_HINT_COOLDOWN_MS,
}) {
  if (installed) return false;
  if (!dismissedAt) return true;
  return now - dismissedAt >= cooldownMs;
}
