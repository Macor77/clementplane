import React from 'react';
import {
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

function LoadingScreen() {
  return (
    <div className="auth-screen">
      <div className="auth-card auth-card--compact">
        <div className="auth-brand">
          <img
            src="/brand/formaplane-logo.svg"
            alt="Formaplane"
            style={{ width: '220px', height: 'auto' }}
          />
        </div>

        <p className="auth-muted">
          Chargement de votre espace…
        </p>
      </div>
    </div>
  );
}

function OrganizationAccountRequired({
  displayName,
  onSwitchAccount,
  switchingAccount,
}) {
  return (
    <div className="auth-screen">
      <div
        className="auth-card auth-card--compact"
        style={{
          maxWidth: 520,
          padding: 28,
        }}
      >
        <div className="auth-brand">
          <img
            src="/brand/formaplane-logo.svg"
            alt="Formaplane"
            style={{
              width: '210px',
              height: 'auto',
            }}
          />
        </div>

        <div
          style={{
            marginTop: 18,
            padding: '16px 17px',
            border: '1px solid #bfdbfe',
            borderRadius: 12,
            background: '#f8fbff',
          }}
        >
          <div
            style={{
              color: '#1d4ed8',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '.8px',
              textTransform: 'uppercase',
            }}
          >
            Espace Organisme de Formation
          </div>

          <h1
            style={{
              margin: '8px 0 8px',
              color: '#0f2747',
              fontSize: 22,
              lineHeight: 1.25,
            }}
          >
            Ce lien est destiné à un organisme de formation
          </h1>

          <p
            style={{
              margin: 0,
              color: '#64748b',
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            Vous êtes actuellement connecté
            {displayName ? (
              <>
                {' '}avec le compte <strong>{displayName}</strong>
              </>
            ) : null}
            , mais ce compte ne dispose pas d’un accès
            Organisme de Formation à cette mission.
          </p>
        </div>

        <p
          style={{
            margin: '16px 0 0',
            color: '#475569',
            fontSize: 13.5,
            lineHeight: 1.6,
          }}
        >
          Pour ouvrir la mission concernée, connectez-vous
          avec le compte de l’organisme de formation qui a
          reçu cet e-mail.
        </p>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            marginTop: 20,
          }}
        >
          <button
            type="button"
            disabled={switchingAccount}
            onClick={onSwitchAccount}
            style={{
              minHeight: 40,
              padding: '0 16px',
              border: '1px solid #2563eb',
              borderRadius: 8,
              background: '#2563eb',
              color: '#ffffff',
              fontWeight: 800,
              cursor: switchingAccount
                ? 'wait'
                : 'pointer',
              opacity: switchingAccount ? 0.7 : 1,
            }}
          >
            {switchingAccount
              ? 'Déconnexion…'
              : 'Se connecter avec un autre compte'}
          </button>

          <a
            href="/formateur/espace"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: 40,
              padding: '0 16px',
              border: '1px solid #d0d5dd',
              borderRadius: 8,
              background: '#ffffff',
              color: '#344054',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Rester dans mon espace formateur
          </a>
        </div>
      </div>
    </div>
  );
}

export function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/connexion"
        replace
        state={{
          from: `${location.pathname}${location.search}`,
        }}
      />
    );
  }

  return children;
}

export function RequireOrganization({ children }) {
  const {
    isAuthenticated,
    memberships,
    currentOrganization,
    trainerProfile,
    displayName,
    signOut,
    loading,
  } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  const requestedOrganizationSpace =
    new URLSearchParams(
      location.search,
    ).get('space') === 'organization';

  const [switchingAccount, setSwitchingAccount] =
    React.useState(false);

  if (loading) return <LoadingScreen />;

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/connexion"
        replace
        state={{
          from: `${location.pathname}${location.search}`,
        }}
      />
    );
  }

  /*
   * Compte double casquette :
   * memberships peut être disponible juste avant
   * currentOrganization. On attend au lieu de rediriger.
   */
  if (!currentOrganization && memberships.length > 0) {
    return <LoadingScreen />;
  }

  /*
   * Lien explicitement destiné à l'espace OF,
   * mais le compte connecté ne possède aucune adhésion OF.
   *
   * On n'envoie plus silencieusement l'utilisateur
   * vers son accueil formateur : on explique la situation
   * et on lui permet de changer de compte.
   */
  if (
    requestedOrganizationSpace &&
    !currentOrganization &&
    memberships.length === 0
  ) {
    const handleSwitchAccount = async () => {
      if (switchingAccount) return;

      setSwitchingAccount(true);

      const returnTo =
        `${location.pathname}${location.search}`;

      try {
        await signOut();

        navigate(
          '/connexion',
          {
            replace: true,
            state: {
              from: returnTo,
            },
          },
        );
      } catch (error) {
        console.error(
          'Impossible de changer de compte',
          error,
        );

        setSwitchingAccount(false);
      }
    };

    return (
      <OrganizationAccountRequired
        displayName={displayName}
        switchingAccount={switchingAccount}
        onSwitchAccount={handleSwitchAccount}
      />
    );
  }

  if (!currentOrganization) {
    if (trainerProfile) {
      return (
        <Navigate
          to="/formateur/espace"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/formateur/revendication"
        replace
      />
    );
  }

  return children;
}
