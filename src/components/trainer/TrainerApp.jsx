import { NavLink, Route, Routes, useNavigate } from 'react-router-dom';

import TrainerDashboard from '../../pages/trainer/TrainerDashboard';
import TrainerProposals from '../../pages/trainer/TrainerProposals';
import TrainerAvailability from '../../pages/trainer/TrainerAvailability';
import TrainerPlanning from '../../pages/trainer/TrainerPlanning';
import TrainerProfile from '../../pages/trainer/TrainerProfile';
import TrainerSettings from '../../pages/trainer/TrainerSettings';

import { useAuth } from '../../context/AuthContext';

const ACTIVE_SPACE_KEY = 'timeforma_active_space';

const navigationItems = [
  {
    to: '/formateur/espace',
    label: 'Accueil',
    icon: '⌂',
    end: true,
  },
  {
    to: '/formateur/propositions',
    label: 'Mes propositions',
    icon: '✉',
  },
  {
    to: '/formateur/disponibilites',
    label: 'Mes disponibilités',
    icon: '▦',
  },
  {
    to: '/formateur/planning',
    label: 'Mon planning',
    icon: '▣',
  },
  {
    to: '/formateur/profil',
    label: 'Mon profil',
    icon: '♙',
  },
  {
    to: '/formateur/parametres',
    label: 'Paramètres',
    icon: '⚙',
  },
];

export default function TrainerApp() {
  const navigate = useNavigate();

  const {
    profile,
    trainerProfile,
    memberships,
    signOut,
  } = useAuth();

  const displayName =
    [profile?.first_name, profile?.last_name]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    [trainerProfile?.prenom, trainerProfile?.nom]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    'Formateur';

  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'F';

  const hasOrganizationSpace = memberships.length > 0;

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
    <div className="app-shell trainer-app">
      <aside className="app-sidebar">
        <div
          className="app-brand"
          style={{
            display: 'flex',
            alignItems: 'center',
            minHeight: '52px',
          }}
        >
          <img
            src="/brand/formaplane-logo-light.svg"
            alt="Formaplane"
            style={{
              display: 'block',
              width: '148px',
              maxWidth: '100%',
              height: 'auto',
              objectFit: 'contain',
            }}
          />
        </div>

        <div className="trainer-sidebar-label">
          ESPACE FORMATEUR
        </div>

        <nav
          className="app-nav"
          aria-label="Navigation espace formateur"
        >
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `app-nav__link${
                  isActive
                    ? ' app-nav__link--active'
                    : ''
                }`
              }
            >
              <span
                className="app-nav__icon"
                aria-hidden="true"
              >
                {item.icon}
              </span>

              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="app-sidebar__footer">
          <div className="user-card">
            <div className="user-card__avatar">
              {initials}
            </div>

            <div className="user-card__content">
              <strong>{displayName}</strong>
              <span>Formateur</span>
            </div>
          </div>

          <div className="trainer-sidebar-actions">
            {hasOrganizationSpace && (
              <button
                type="button"
                onClick={handleChangeSpace}
              >
                Changer d’espace
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </aside>

      <main className="app-main">
        <Routes>
          <Route
            path="/formateur/espace"
            element={<TrainerDashboard />}
          />

          <Route
            path="/formateur/propositions"
            element={<TrainerProposals />}
          />

          <Route
            path="/formateur/disponibilites"
            element={<TrainerAvailability />}
          />

          <Route
            path="/formateur/planning"
            element={<TrainerPlanning />}
          />

          <Route
            path="/formateur/profil"
            element={<TrainerProfile />}
          />

          <Route
            path="/formateur/parametres"
            element={<TrainerSettings />}
          />
        </Routes>
      </main>
    </div>
  );
}
