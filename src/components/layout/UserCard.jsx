import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ACTIVE_SPACE_KEY =
  'timeforma_active_space';

const roleLabels = {
  owner: 'Propriétaire',
  admin: 'Administrateur',
  manager: 'Dirigeant',
  coordinator: 'Coordinateur',
  assistant: 'Assistant',
  viewer: 'Lecture seule',
};

function getInitials(value, fallback) {
  const initials =
    String(value || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part.charAt(0).toUpperCase(),
      )
      .join('');

  return initials || fallback;
}

export default function UserCard() {
  const navigate = useNavigate();

  const {
    displayName,
    currentOrganization,
    organizationRole,
    trainerProfile,
    signOut,
  } = useAuth();

  const userInitials =
    getInitials(
      displayName,
      'U',
    );

  const organizationName =
    currentOrganization?.name ||
    'Organisation';

  const organizationInitials =
    getInitials(
      organizationName,
      'OF',
    );

  const roleLabel =
    roleLabels[organizationRole] ||
    organizationRole ||
    '';

  const hasTrainerSpace =
    Boolean(trainerProfile);

  const handleChangeSpace = () => {
    sessionStorage.removeItem(
      ACTIVE_SPACE_KEY,
    );

    navigate(
      '/choisir-espace',
    );
  };

  const handleLogout = async () => {
    sessionStorage.removeItem(
      ACTIVE_SPACE_KEY,
    );

    await signOut();

    navigate(
      '/connexion',
      { replace: true },
    );
  };

  const identityRowStyle = {
    display: 'grid',
    gridTemplateColumns: '36px minmax(0, 1fr)',
    alignItems: 'center',
    gap: '9px',
  };

  const avatarStyle = {
    width: '36px',
    height: '36px',
    borderRadius: '9px',
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
    fontSize: '13px',
    fontWeight: 800,
    lineHeight: 1,
  };

  const identityTextStyle = {
    minWidth: 0,
    display: 'grid',
    gap: '2px',
  };

  const strongStyle = {
    display: 'block',
    minWidth: 0,
    overflow: 'hidden',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 750,
    lineHeight: 1.25,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const secondaryStyle = {
    display: 'block',
    minWidth: 0,
    overflow: 'hidden',
    color: 'rgba(255, 255, 255, 0.62)',
    fontSize: '10px',
    lineHeight: 1.3,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gap: '13px',
        }}
      >
        <div style={identityRowStyle}>
          <div
            style={{
              ...avatarStyle,
              border:
                '1px solid rgba(96, 165, 250, 0.55)',
              background:
                'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#fff',
            }}
            aria-label="Utilisateur"
            title="Photo de l’utilisateur à venir"
          >
            {userInitials}
          </div>

          <div style={identityTextStyle}>
            <strong
              style={strongStyle}
              title={displayName}
            >
              {displayName}
            </strong>

            <span style={secondaryStyle}>
              Utilisateur
            </span>
          </div>
        </div>

        <div style={identityRowStyle}>
          <div
            style={{
              ...avatarStyle,
              border:
                '1px solid rgba(255, 255, 255, 0.45)',
              background: '#fff',
              color: '#172554',
            }}
            aria-label="Organisme"
            title="Logo de l’organisme à venir"
          >
            {organizationInitials}
          </div>

          <div style={identityTextStyle}>
            <strong
              style={strongStyle}
              title={organizationName}
            >
              {organizationName}
            </strong>

            <span style={secondaryStyle}>
              {roleLabel || 'Membre'}
            </span>
          </div>
        </div>
      </div>

      <div
        className="trainer-sidebar-actions"
        style={{
          marginTop: '16px',
          paddingTop: '12px',
          borderTop:
            '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        {hasTrainerSpace && (
          <button
            type="button"
            onClick={handleChangeSpace}
          >
            ↔ Changer d’espace
          </button>
        )}

        <button
          type="button"
          onClick={handleLogout}
        >
          ⇥ Se déconnecter
        </button>
      </div>
    </div>
  );
}
