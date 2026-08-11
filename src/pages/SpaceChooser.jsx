import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const ACTIVE_SPACE_KEY = 'timeforma_active_space';

export default function SpaceChooser() {
  const navigate = useNavigate();

  const {
    displayName,
    memberships,
    trainerProfile,
    currentOrganization,
    setCurrentOrganizationId,
  } = useAuth();

  const hasOrganization = memberships.length > 0;
  const hasTrainerProfile = Boolean(trainerProfile);

  const openOrganizationSpace = () => {
    const organization =
      currentOrganization ||
      memberships[0]?.organization;

    if (organization?.id) {
      setCurrentOrganizationId(organization.id);
    }

    sessionStorage.setItem(
      ACTIVE_SPACE_KEY,
      'organization',
    );

    navigate('/', { replace: true });
  };

  const openTrainerSpace = () => {
    sessionStorage.setItem(
      ACTIVE_SPACE_KEY,
      'trainer',
    );

    navigate(
      '/formateur/espace',
      { replace: true },
    );
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          Time<span>Forma</span>
        </div>

        <p className="auth-eyebrow">
          CHOISIR UN ESPACE
        </p>

        <h1>Bonjour {displayName}</h1>

        <p className="auth-description">
          Votre compte possède plusieurs usages TimeForma.
          Choisissez l’espace dans lequel vous souhaitez
          travailler.
        </p>

        <div
          style={{
            display: 'grid',
            gap: '16px',
            marginTop: '28px',
          }}
        >
          {hasOrganization && (
            <button
              type="button"
              className="auth-button"
              onClick={openOrganizationSpace}
            >
              Espace organisme
              {currentOrganization?.name
                ? ` — ${currentOrganization.name}`
                : ''}
            </button>
          )}

          {hasTrainerProfile && (
            <button
              type="button"
              className="auth-button"
              onClick={openTrainerSpace}
            >
              Espace formateur
            </button>
          )}
        </div>
      </div>
    </div>
  );
}