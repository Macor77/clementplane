import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function LoadingScreen() {
  return (
    <div className="auth-screen">
      <div className="auth-card auth-card--compact">
        <div className="auth-brand">Time<span>Forma</span></div>
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
    return <Navigate to="/connexion" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export function RequireOrganization({ children }) {
  const { isAuthenticated, memberships, currentOrganization, trainerProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;

  if (!isAuthenticated) {
    return <Navigate to="/connexion" replace state={{ from: location.pathname }} />;
  }

  if (!currentOrganization) {
    if (trainerProfile) return <Navigate to="/formateur/espace" replace />;
    if (memberships.length === 0) return <Navigate to="/formateur/revendication" replace />;
  }

  return children;
}
