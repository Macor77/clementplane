import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const ACTIVE_SPACE_KEY = 'timeforma_active_space';

export default function TrainerHome() {
  const navigate = useNavigate();

  const {
    profile,
    trainerProfile,
    memberships,
    signOut,
  } = useAuth();

  const firstName =
    profile?.first_name ||
    trainerProfile?.prenom ||
    'Formateur';

  const hasOrganization =
    memberships.length > 0;

  const changeSpace = () => {
    sessionStorage.removeItem(
      ACTIVE_SPACE_KEY,
    );

    navigate(
      '/choisir-espace',
      { replace: true },
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

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          Time<span>Forma</span>
        </div>

        <p className="auth-eyebrow">
          ESPACE FORMATEUR
        </p>

        <h1>Bonjour {firstName}</h1>

        <p className="auth-description">
          Votre espace personnel TimeForma est
          maintenant identifié. Son tableau de bord
          complet sera construit dans les prochaines
          étapes du Mini Sprint 8.3.
        </p>

        <div
          style={{
            marginTop: '26px',
            padding: '18px',
            border: '1px solid #dbe3ef',
            borderRadius: '14px',
          }}
        >
          <strong>
            Mon profil formateur
          </strong>

          <p
            style={{
              margin: '7px 0 0',
              color: '#64748b',
            }}
          >
            {trainerProfile?.prenom}{' '}
            {trainerProfile?.nom}
          </p>

          <p
            style={{
              margin: '4px 0 0',
              color: '#64748b',
            }}
          >
            Fiche professionnelle rattachée à votre
            compte TimeForma.
          </p>
        </div>

        {hasOrganization && (
          <button
            className="auth-button"
            style={{ marginTop: 22 }}
            type="button"
            onClick={changeSpace}
          >
            Changer d’espace
          </button>
        )}

        <button
          className="auth-button"
          style={{
            marginTop: 12,
            background: '#fff',
            color: '#2563eb',
            border: '1px solid #2563eb',
          }}
          type="button"
          onClick={handleLogout}
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}