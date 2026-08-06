import { useAuth } from '../../context/AuthContext';

const roleLabels = {
  owner: 'Propriétaire',
  admin: 'Administrateur',
  manager: 'Dirigeant',
  coordinator: 'Coordinateur',
  assistant: 'Assistant',
  viewer: 'Consultation',
};

export default function UserCard() {
  const {
    displayName,
    currentOrganization,
    organizationRole,
    isAuthenticated,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <div className="user-card" aria-live="polite">
        <span className="user-card__avatar" aria-hidden="true">…</span>
        <div className="user-card__content">
          <strong>Chargement…</strong>
          <span>Contexte utilisateur</span>
        </div>
      </div>
    );
  }

  const roleLabel = roleLabels[organizationRole] || null;
  const organizationName = currentOrganization?.name || null;
  const subtitle = [roleLabel, organizationName].filter(Boolean).join(' • ');

  return (
    <div className="user-card">
      <span className="user-card__avatar" aria-hidden="true">
        {isAuthenticated ? displayName.charAt(0).toUpperCase() : 'U'}
      </span>
      <div className="user-card__content">
        <strong>{displayName}</strong>
        <span>{subtitle || 'Session non connectée'}</span>
      </div>
    </div>
  );
}
