export const E2E_ORG_EMAIL = 'e2e.of@clementplane.test';
export const E2E_TRAINER_EMAIL = 'e2e.trainer@clementplane.test';
export const E2E_ORG_SLUG = 'clementplane-e2e';
export const E2E_ORG_NAME = 'Clementplane E2E';
export const E2E_TRAINER_FIRST_NAME = 'E2E';
export const E2E_TRAINER_LAST_NAME = 'Formateur';
export const E2E_MISSION_TITLE = 'E2E Mission Sprint 18';

export function futureIsoDate(days = 14) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
