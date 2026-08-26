import { useEffect, useState } from 'react';
import {
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import Listing from './pages/Listing';
import TrainerSearch from './pages/TrainerSearch';
import TrainerBulkImport from './pages/TrainerBulkImport';
import FormateurForm from './pages/FormateurForm';
import FormateurView from './pages/FormateurView';
import Missions from './pages/Missions';
import MissionDetail from './pages/MissionDetail';
import MissionForm from './pages/MissionForm';
import MigrateLocal from './pages/MigrateLocal';
import EnvCheck from './pages/EnvCheck';
import Dashboard from './pages/Dashboard';
import Planning from './pages/Planning';
import MapPage from './pages/MapPage';
import Settings from './pages/Settings';
import DiscoverFormaplane from './pages/DiscoverFormaplane';
import ProposalResponse from './pages/ProposalResponse';
import MissionChangeResponse from './pages/MissionChangeResponse';

import Login from './pages/Login';
import Signup from './pages/Signup';
import OrganizationSignup from './pages/OrganizationSignup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PublicLanding from './pages/PublicLanding';
import AdminApp from './pages/admin/AdminApp';
import FeatureNewsUnsubscribe from './pages/FeatureNewsUnsubscribe';
import OrganizationInvitationLanding from './pages/OrganizationInvitationLanding';

import TrainerClaimStart from './pages/TrainerClaimStart';
import SpaceChooser from './pages/SpaceChooser';

import TrainerApp from './components/trainer/TrainerApp';
import UserCard from './components/layout/UserCard';
import MobileNavigation from './components/layout/MobileNavigation';

import {
  RequireAuth,
  RequireOrganization,
} from './components/auth/AuthGate';

import { useAuth } from './context/AuthContext';
import { getTrainerClaimCandidates } from './services/trainerClaimService';
import { trackProductEvent } from './services/productAnalyticsService';

import './App.css';

const ACTIVE_SPACE_KEY = 'timeforma_active_space';

const navigationItems = [
  {
    to: '/',
    label: 'Accueil',
    icon: '⌂',
    end: true,
  },
  {
    to: '/listing',
    label: 'Formateurs',
    icon: '♙',
  },
  {
    to: '/missions',
    label: 'Missions',
    icon: '▣',
  },
  {
    to: '/planning',
    label: 'Planning',
    icon: '▦',
  },
  {
    to: '/carte',
    label: 'Carte',
    icon: '⌖',
  },
  {
    to: '/decouvrir',
    label: 'Découvrir Formaplane',
    icon: '?',
  },
  {
    to: '/decouvrir#contact',
    label: 'Nous contacter',
    icon: '✉',
  },
  {
    to: '/parametres',
    label: 'Paramètres',
    icon: '⚙',
  },
];

/*
 * Routes appartenant réellement à
 * l'espace personnel du Formateur.
 *
 * IMPORTANT :
 * /formateur/view/:id
 * /formateur/edit/:id
 * /formateur/new
 *
 * appartiennent à l'espace OF et ne doivent
 * donc jamais être capturées ici.
 */
function isTrainerPersonalPath(pathname) {
  return (
    pathname === '/formateur/espace' ||
    pathname === '/formateur/propositions' ||
    pathname === '/formateur/missions' ||
    pathname.startsWith('/formateur/missions/') ||
    pathname === '/formateur/disponibilites' ||
    pathname === '/formateur/mes-of' ||
    pathname === '/formateur/partage-disponibilites' ||
    pathname === '/formateur/planning' ||
    pathname === '/formateur/profil' ||
    pathname === '/formateur/decouvrir' ||
    pathname === '/formateur/parametres'
  );
}

function OrganizationApp() {
  return (
    <RequireOrganization>
      <div className="app-shell">
        <MobileNavigation
          spaceLabel="Espace organisme de formation"
          navigationItems={navigationItems}
          footer={<UserCard />}
        />

        <aside className="app-sidebar">
          <div className="app-brand">
            <img
              className="app-brand__logo"
              src="/brand/formaplane-logo-light.svg"
              alt="Formaplane"
            />
          </div>

          <div className="trainer-sidebar-label">
            ESPACE ORGANISME DE FORMATION
          </div>

          <nav
            className="app-nav"
            aria-label="Navigation principale"
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
            <UserCard />
          </div>
        </aside>

        <main className="app-main">
          <Routes>
            <Route
              path="/"
              element={<Dashboard />}
            />

            <Route
              path="/planning"
              element={<Planning />}
            />

            <Route
              path="/listing"
              element={<Listing />}
            />

            <Route
              path="/formateurs/recherche"
              element={<TrainerSearch />}
            />

            <Route
              path="/formateurs/import"
              element={<TrainerBulkImport />}
            />

            <Route
              path="/formateur/view/:id"
              element={<FormateurView />}
            />

            <Route
              path="/formateur/edit/:id"
              element={<FormateurForm />}
            />

            <Route
              path="/formateur/new"
              element={<FormateurForm />}
            />

            <Route
              path="/missions"
              element={<Missions />}
            />

            <Route
              path="/missions/new"
              element={<MissionForm />}
            />

            <Route
              path="/missions/:id"
              element={<MissionDetail />}
            />

            <Route
              path="/missions/edit/:id"
              element={<MissionForm />}
            />

            <Route
              path="/carte"
              element={<MapPage />}
            />

            <Route
              path="/decouvrir"
              element={<DiscoverFormaplane audience="organization" />}
            />

            <Route
              path="/parametres"
              element={<Settings />}
            />

            <Route
              path="/migrate-local"
              element={<MigrateLocal />}
            />

            <Route
              path="/env-check"
              element={<EnvCheck />}
            />
          </Routes>
        </main>
      </div>
    </RequireOrganization>
  );
}

function AccountRouter() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    user,
    memberships,
    trainerProfile,
    loading,
  } = useAuth();

  const [checkingClaim, setCheckingClaim] =
    useState(false);

  const hasOrganization =
    memberships.length > 0;

  const hasTrainer =
    Boolean(trainerProfile);

  const trainerPersonalRoute =
    isTrainerPersonalPath(
      location.pathname,
    );

  const requestedOrganizationSpace =
    new URLSearchParams(
      location.search,
    ).get('space') === 'organization';

  useEffect(() => {
    let active = true;

    async function determineDestination() {
      if (loading || !user) {
        return;
      }

      /*
       * Lien profond explicitement destiné à l'espace OF.
       *
       * Exemple : lien reçu par e-mail après la réponse
       * d'un formateur.
       *
       * Pour un utilisateur "double casquette", on force
       * l'espace Organisme au lieu de le renvoyer vers
       * son accueil Formateur.
       */
      if (
        requestedOrganizationSpace &&
        hasOrganization
      ) {
        sessionStorage.setItem(
          ACTIVE_SPACE_KEY,
          'organization',
        );

        return;
      }

      /*
       * Pages explicitement choisies par
       * l'utilisateur.
       */
      if (
        location.pathname ===
          '/choisir-espace' ||
        location.pathname ===
          '/formateur/revendication' ||
        trainerPersonalRoute
      ) {
        return;
      }

      /*
       * DOUBLE CASQUETTE
       */
      if (
        hasOrganization &&
        hasTrainer
      ) {
        const activeSpace =
          sessionStorage.getItem(
            ACTIVE_SPACE_KEY,
          );

        /*
         * Si l'utilisateur travaille dans
         * l'espace OF, aucune redirection.
         *
         * Cela permet notamment :
         * /formateur/view/:id
         * /formateur/edit/:id
         * /formateur/new
         */
        if (
          activeSpace ===
          'organization'
        ) {
          return;
        }

        /*
         * Si l'espace Formateur est actif
         * mais qu'une URL OF a été ouverte,
         * on revient vers l'accueil personnel.
         */
        if (
          activeSpace ===
          'trainer'
        ) {
          navigate(
            '/formateur/espace',
            { replace: true },
          );

          return;
        }

        navigate(
          '/choisir-espace',
          { replace: true },
        );

        return;
      }

      /*
       * FORMATEUR UNIQUEMENT
       */
      if (
        !hasOrganization &&
        hasTrainer
      ) {
        sessionStorage.setItem(
          ACTIVE_SPACE_KEY,
          'trainer',
        );

        if (!trainerPersonalRoute) {
          navigate(
            '/formateur/espace',
            { replace: true },
          );
        }

        return;
      }

      /*
       * ORGANISME UNIQUEMENT.
       *
       * On vérifie quand même si une fiche
       * formateur portant exactement le même
       * e-mail existe.
       */
      if (
        hasOrganization &&
        !hasTrainer
      ) {
        setCheckingClaim(true);

        try {
          const candidates =
            await getTrainerClaimCandidates();

          if (!active) {
            return;
          }

          if (
            candidates.length > 0
          ) {
            sessionStorage.removeItem(
              ACTIVE_SPACE_KEY,
            );

            navigate(
              '/formateur/revendication',
              { replace: true },
            );

            return;
          }

          sessionStorage.setItem(
            ACTIVE_SPACE_KEY,
            'organization',
          );
        } catch (claimError) {
          console.error(
            'Impossible de vérifier les fiches formateur',
            claimError,
          );
        } finally {
          if (active) {
            setCheckingClaim(false);
          }
        }

        return;
      }

      /*
       * NOUVEAU COMPTE
       */
      if (
        !hasOrganization &&
        !hasTrainer
      ) {
        navigate(
          '/formateur/revendication',
          { replace: true },
        );
      }
    }

    determineDestination();

    return () => {
      active = false;
    };
  }, [
    user,
    memberships,
    trainerProfile,
    loading,
    hasOrganization,
    hasTrainer,
    trainerPersonalRoute,
    requestedOrganizationSpace,
    location.pathname,
    location.search,
    navigate,
  ]);

  if (
    loading ||
    checkingClaim
  ) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#f5f7fb',
          color: '#64748b',
          fontWeight: 600,
        }}
      >
        Chargement de votre espace Formaplane…
      </div>
    );
  }

  /*
   * Sélecteur d'espace.
   */
  if (
    location.pathname ===
    '/choisir-espace'
  ) {
    return <SpaceChooser />;
  }

  /*
   * Revendication.
   */
  if (
    location.pathname ===
    '/formateur/revendication'
  ) {
    return <TrainerClaimStart />;
  }

  /*
   * Espace personnel Formateur uniquement.
   */
  if (trainerPersonalRoute) {
    return <TrainerApp />;
  }

  /*
   * Toutes les autres routes appartiennent
   * à l'espace OF.
   *
   * Cela inclut notamment :
   *
   * /formateur/view/:id
   * /formateur/edit/:id
   * /formateur/new
   */
  return <OrganizationApp />;
}

function RootRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#64748b', fontWeight: 600 }}>
        Chargement de Formaplane…
      </div>
    );
  }

  if (!user) {
    return <PublicLanding />;
  }

  return <AccountRouter />;
}

export default function App() {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (!user || location.pathname.startsWith('/admin')) return;

    const path = location.pathname;
    let eventName = null;
    if (path === '/') eventName = 'organization_dashboard_viewed';
    else if (path === '/listing' || path === '/formateurs/recherche') eventName = 'trainer_search_viewed';
    else if (path === '/missions') eventName = 'missions_viewed';
    else if (path === '/planning' || path === '/formateur/planning') eventName = 'planning_viewed';
    else if (path === '/decouvrir' || path === '/formateur/decouvrir') eventName = 'discover_viewed';
    else if (path === '/formateur/espace') eventName = 'trainer_dashboard_viewed';
    else if (path === '/formateur/propositions') eventName = 'proposals_viewed';
    else if (path === '/formateur/disponibilites') eventName = 'availability_viewed';
    else if (path === '/formateur/mes-of') eventName = 'trainer_organizations_viewed';
    else if (path === '/formateur/partage-disponibilites') eventName = 'availability_share_viewed';

    if (eventName) {
      trackProductEvent(eventName, path).catch((error) => {
        console.warn('Statistique produit non enregistrée', error);
      });
    }
  }, [user, location.pathname]);

  if (location.pathname === '/desabonnement-nouveautes') {
    return <FeatureNewsUnsubscribe />;
  }

  if (location.pathname === '/admin' || location.pathname.startsWith('/admin/')) {
    return (
      <RequireAuth>
        <AdminApp />
      </RequireAuth>
    );
  }

  /*
   * Revalidation publique d'une modification de mission.
   */
  if (
    location.pathname.startsWith(
      '/revalidation/',
    )
  ) {
    return (
      <Routes>
        <Route
          path="/revalidation/:token"
          element={<MissionChangeResponse />}
        />
      </Routes>
    );
  }

  /*
   * Proposition publique.
   */
  if (
    location.pathname.startsWith(
      '/proposition/',
    )
  ) {
    return (
      <Routes>
        <Route
          path="/proposition/:token"
          element={<ProposalResponse />}
        />
      </Routes>
    );
  }

  if (location.pathname.startsWith('/invitation-of/')) {
    return (
      <Routes>
        <Route
          path="/invitation-of/:token"
          element={<OrganizationInvitationLanding />}
        />
      </Routes>
    );
  }

  if (
    location.pathname ===
    '/connexion'
  ) {
    return (
      <Routes>
        <Route
          path="/connexion"
          element={<Login />}
        />
      </Routes>
    );
  }

  if (
    location.pathname ===
    '/inscription'
  ) {
    return (
      <Routes>
        <Route
          path="/inscription"
          element={<Signup />}
        />
      </Routes>
    );
  }

  if (
    location.pathname ===
    '/inscription-organisme'
  ) {
    return (
      <Routes>
        <Route
          path="/inscription-organisme"
          element={<OrganizationSignup />}
        />
      </Routes>
    );
  }


  if (
    location.pathname ===
    '/mot-de-passe-oublie'
  ) {
    return (
      <Routes>
        <Route
          path="/mot-de-passe-oublie"
          element={<ForgotPassword />}
        />
      </Routes>
    );
  }

  if (
    location.pathname ===
    '/reinitialiser-mot-de-passe'
  ) {
    return (
      <Routes>
        <Route
          path="/reinitialiser-mot-de-passe"
          element={<ResetPassword />}
        />
      </Routes>
    );
  }

  if (location.pathname === '/') {
    return <RootRoute />;
  }

  return (
    <RequireAuth>
      <AccountRouter />
    </RequireAuth>
  );
}