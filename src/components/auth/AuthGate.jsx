import { Navigate, useLocation } from 'react-router-dom';
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
        <p className="auth-muted">Chargement de votre espace…</p>
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
    loading,
  } = useAuth();

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

  /*
   * IMPORTANT — compte double casquette / lien profond OF
   *
   * Lorsqu'un utilisateur possède bien au moins une adhésion OF,
   * `memberships` peut être disponible un très court instant avant
   * que `currentOrganization` soit résolu par AuthContext.
   *
   * Dans ce cas il ne faut surtout pas rediriger vers l'espace
   * Formateur : on attend simplement que l'organisation courante
   * soit déterminée. Cela permet notamment de conserver les liens
   * profonds du type :
   *
   * /missions/:id?space=organization
   */
  if (!currentOrganization && memberships.length > 0) {
    return <LoadingScreen />;
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
