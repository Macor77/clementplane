import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import {
  getOrganizationInvitationTarget,
  getPublicTrainerOrganizationInvitation,
} from '../services/trainerOrganizationsService';
import './Auth.css';

export default function OrganizationInvitationLanding() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, memberships, loading: authLoading } = useAuth();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await getPublicTrainerOrganizationInvitation(token);
        if (!active) return;
        if (!data?.trainer_id) {
          setError("Cette invitation n'est plus disponible.");
        } else {
          setInvitation(data);
        }
      } catch (loadError) {
        if (active) setError(loadError?.message || "Cette invitation n'est plus disponible.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [token]);

  const trainerName = useMemo(
    () => [invitation?.trainer_first_name, invitation?.trainer_last_name].filter(Boolean).join(' ').trim() || 'Un formateur partenaire',
    [invitation],
  );

  useEffect(() => {
    if (authLoading || loading || !invitation?.trainer_id) return;
    if (user && memberships.length > 0) {
      sessionStorage.setItem('timeforma_active_space', 'organization');
      navigate(getOrganizationInvitationTarget(invitation.trainer_id), { replace: true });
    }
  }, [authLoading, loading, invitation, user, memberships, navigate]);

  if (loading || authLoading) {
    return <div className="auth-screen"><div className="auth-card">Chargement de l’invitation…</div></div>;
  }

  if (error || !invitation) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="auth-brand"><img src="/brand/formaplane-logo.svg" alt="Formaplane" /></div>
          <h1>Invitation indisponible</h1>
          <p className="auth-muted">{error || "Cette invitation n'est plus disponible."}</p>
          <Link className="auth-button auth-button--link" to="/">Découvrir Formaplane</Link>
        </div>
      </div>
    );
  }

  const signupUrl = `/inscription-organisme?invitation=${encodeURIComponent(token)}`;
  const loginUrl = `/connexion?invitation=${encodeURIComponent(token)}`;

  return (
    <div className="auth-screen">
      <div className="auth-card auth-card--wide">
        <div className="auth-brand"><img src="/brand/formaplane-logo.svg" alt="Formaplane" /></div>
        <p className="auth-eyebrow">INVITATION FORMAPLANE</p>
        <h1>{trainerName} vous invite</h1>
        <p className="auth-muted">
          {trainerName} utilise Formaplane pour tenir ses disponibilités à jour et vous invite à rejoindre la plateforme.
        </p>
        <div className="auth-alert" style={{ marginTop: 18, background: '#eff6ff', color: '#1e3a8a', border: '1px solid #bfdbfe' }}>
          Après votre inscription ou votre connexion, vous arriverez directement sur sa fiche pour pouvoir l’ajouter à votre réseau.
        </div>
        {!user ? (
          <div style={{ display: 'grid', gap: 10, marginTop: 20 }}>
            <Link className="auth-button auth-button--link" to={signupUrl}>Créer mon espace OF</Link>
            <Link to={loginUrl} style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #2563eb', borderRadius: 10, color: '#2563eb', fontWeight: 800, textDecoration: 'none' }}>
              J’ai déjà un compte Formaplane
            </Link>
          </div>
        ) : (
          <div className="auth-alert auth-alert--error" style={{ marginTop: 18 }}>
            Votre compte connecté ne possède pas encore d’espace organisme. Utilisez l’adresse invitée pour créer ou rattacher votre espace OF.
          </div>
        )}
      </div>
    </div>
  );
}
