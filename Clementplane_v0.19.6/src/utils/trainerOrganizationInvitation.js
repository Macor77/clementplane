export function isOrganizationInvitationCoolingDown(
  nextInvitationAt,
  now = new Date(),
) {
  if (!nextInvitationAt) return false;
  const target = new Date(nextInvitationAt).getTime();
  const reference = now instanceof Date ? now.getTime() : new Date(now).getTime();
  return Number.isFinite(target) && Number.isFinite(reference) && target > reference;
}

export function formatNextInvitationLabel(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function getOrganizationInvitationTarget(trainerId) {
  return `/formateur/view/${encodeURIComponent(String(trainerId || ''))}?space=organization`;
}
