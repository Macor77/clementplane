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

export default function UserCard() {
  const navigate = useNavigate();

  const {
    displayName,
    currentOrganization,
    organizationRole,
    trainerProfile,
  } = useAuth();

  const initials =
    displayName
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part.charAt(0).toUpperCase(),
      )
      .join('') || 'U';

  const roleLabel =
    roleLabels[organizationRole] ||
    organizationRole ||
    '';

  const organizationName =
    currentOrganization?.name ||
    'Organisation';

  const hasTrainerSpace =
    Boolean(trainerProfile);

  const handleChangeSpace = () => {
    /*
     * On oublie l'espace OF actuellement
     * sélectionné afin que l'écran de choix
     * puisse reprendre la main.
     */
    sessionStorage.removeItem(
      ACTIVE_SPACE_KEY,
    );

    navigate(
      '/choisir-espace',
    );
  };

  return (
    <div>
      <div className="user-card">
        <div className="user-card__avatar">
          {initials}
        </div>

        <div className="user-card__content">
          <strong>
            {displayName}
          </strong>

          <span>
            {roleLabel
              ? `${roleLabel} • ${organizationName}`
              : organizationName}
          </span>
        </div>
      </div>

      {hasTrainerSpace && (
        <button
          type="button"
          onClick={handleChangeSpace}
          style={{
            width: '100%',
            marginTop: '10px',
            padding: '5px 0',
            border: 0,
            background: 'transparent',
            color:
              'rgba(255, 255, 255, 0.68)',
            font: 'inherit',
            fontSize: '10px',
            fontWeight: 650,
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >
          ↔ Changer d’espace
        </button>
      )}
    </div>
  );
}