export const LEGAL_VERSIONS = Object.freeze({
  cgu: '2026-08-29',
  privacy: import.meta.env?.VITE_MICROSOFT_CALENDAR_ENABLED === 'true' ? '2026-10-28' : '2026-10-08',
});
