import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ACTIVE_SPACE_KEY = 'timeforma_active_space';

export default function TrainerSettings() {
  const navigate = useNavigate();

  const {
    memberships,
    signOut,
  } = useAuth();

  const handleChangeSpace = () => {
    sessionStorage.removeItem(ACTIVE_SPACE_KEY);
    navigate('/choisir-espace');
  };

  const handleLogout = async () => {
    sessionStorage.removeItem(ACTIVE_SPACE_KEY);
    await signOut();
    navigate('/connexion', { replace: true });
  };

  return (
    <div className="page-container">
      <div className="page-heading">
        <div>
          <p className="page-eyebrow">
            PARAMÈTRES
          </p>

          <h1>Mon compte</h1>

          <p>
            Gérez votre session et vos espaces
            Formaplane.
          </p>
        </div>
      </div>

      <div className="panel-card trainer-settings-card">
        <h2>Session</h2>

        <p>
          Vous êtes connecté à votre espace
          Formateur.
        </p>

        <div className="trainer-settings-actions">
          {memberships.length > 0 && (
            <button
              className="button button--soft"
              type="button"
              onClick={handleChangeSpace}
            >
              Changer d’espace
            </button>
          )}

          <button
            className="button"
            type="button"
            onClick={handleLogout}
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}