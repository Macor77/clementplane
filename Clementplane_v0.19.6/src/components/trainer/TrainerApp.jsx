import { NavLink, Route, Routes, useNavigate } from 'react-router-dom';

import TrainerDashboard from '../../pages/trainer/TrainerDashboard';
import TrainerProposals from '../../pages/trainer/TrainerProposals';
import TrainerMissions from '../../pages/trainer/TrainerMissions';
import TrainerMissionDetail from '../../pages/trainer/TrainerMissionDetail';
import TrainerOrganizationContact from '../../pages/trainer/TrainerOrganizationContact';
import TrainerAvailability from '../../pages/trainer/TrainerAvailability';
import TrainerOrganizations from '../../pages/trainer/TrainerOrganizations';
import TrainerPlanning from '../../pages/trainer/TrainerPlanning';
import TrainerAvailabilityShare from '../../pages/trainer/TrainerAvailabilityShare';
import TrainerProfile from '../../pages/trainer/TrainerProfile';
import TrainerSettings from '../../pages/trainer/TrainerSettings';
import DiscoverClementplane from '../../pages/DiscoverClementplane';

import { useAuth } from '../../context/AuthContext';
import MobileNavigation from '../layout/MobileNavigation';

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
    to: '/formateur/missions',
    label: 'Mes missions',
    icon: '▣',
  },
  {
    to: '/formateur/disponibilites',
    label: 'Mes disponibilités',
    icon: '▦',
  },
  {
    to: '/formateur/mes-of',
    label: 'Mes OF',
    icon: '◎',
  },
  {
    to: '/formateur/partage-disponibilites',
    label: 'Partager mes disponibilités',
    icon: '↗',
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
    to: '/formateur/decouvrir',
    label: 'Découvrir Clementplane',
    icon: '?',
  },
  {
    to: '/formateur/decouvrir#contact',
    label: 'Nous contacter',
    icon: '✉',
  },
  {
    to: '/formateur/parametres',
    label: 'Paramètres',
    icon: '⚙',
  },

];

function TrainerNavigationFooter({
  initials,
  displayName,
  hasOrganizationSpace,
  onChangeSpace,
  onLogout,
}) {
  return (
    <>
      <div className="user-card">
        <div className="user-card__avatar">{initials}</div>
        <div className="user-card__content">
          <strong>{displayName}</strong>
          <span>Formateur</span>
        </div>
      </div>

      <div className="trainer-sidebar-actions">
        {hasOrganizationSpace && (
          <button type="button" onClick={onChangeSpace}>
            Changer d’espace
          </button>
        )}
        <button type="button" onClick={onLogout}>
          Se déconnecter
        </button>
      </div>
    </>
  );
}

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
      <MobileNavigation
        spaceLabel="Espace formateur"
        navigationItems={navigationItems}
        footer={
          <TrainerNavigationFooter
            initials={initials}
            displayName={displayName}
            hasOrganizationSpace={hasOrganizationSpace}
            onChangeSpace={handleChangeSpace}
            onLogout={handleLogout}
          />
        }
      />

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
            src="/brand/clementplane-logo-light.svg"
            alt="Clementplane"
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
          <TrainerNavigationFooter
            initials={initials}
            displayName={displayName}
            hasOrganizationSpace={hasOrganizationSpace}
            onChangeSpace={handleChangeSpace}
            onLogout={handleLogout}
          />
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
            path="/formateur/missions"
            element={<TrainerMissions />}
          />

          <Route
            path="/formateur/missions/:id"
            element={<TrainerMissionDetail />}
          />

          <Route
            path="/formateur/missions/:id/organisme"
            element={<TrainerOrganizationContact />}
          />

          <Route
            path="/formateur/disponibilites"
            element={<TrainerAvailability />}
          />

          <Route
            path="/formateur/mes-of"
            element={<TrainerOrganizations />}
          />

          <Route
            path="/formateur/partage-disponibilites"
            element={<TrainerAvailabilityShare />}
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
            path="/formateur/decouvrir"
            element={<DiscoverClementplane audience="trainer" />}
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
