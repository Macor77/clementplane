/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getCurrentSession, getCurrentUserContext } from '../services/currentUserService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [currentOrganizationId, setCurrentOrganizationId] = useState(null);
  const [trainerProfile, setTrainerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadUserContext(nextSession) {
      if (!active) return;

      setSession(nextSession);
      setError(null);

      if (!nextSession?.user) {
        setProfile(null);
        setMemberships([]);
        setCurrentOrganizationId(null);
        setTrainerProfile(null);
        setLoading(false);
        return;
      }

      try {
        const context = await getCurrentUserContext(nextSession.user.id);
        if (!active) return;

        setProfile(context?.profile || null);
        setMemberships(context?.memberships || []);
        setTrainerProfile(context?.trainerProfile || null);
        setCurrentOrganizationId((currentId) => {
          const stillExists = context?.memberships?.some(
            (membership) => membership.organization.id === currentId,
          );
          return stillExists ? currentId : context?.memberships?.[0]?.organization.id || null;
        });
      } catch (loadError) {
        if (!active) return;
        console.error('Impossible de charger le contexte utilisateur', loadError);
        setError(loadError);
      } finally {
        if (active) setLoading(false);
      }
    }

    getCurrentSession()
      .then(loadUserContext)
      .catch((sessionError) => {
        if (!active) return;
        console.error('Impossible de charger la session', sessionError);
        setError(sessionError);
        setLoading(false);
      });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setLoading(true);
      loadUserContext(nextSession);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const currentMembership = useMemo(
    () => memberships.find(
      (membership) => membership.organization.id === currentOrganizationId,
    ) || null,
    [memberships, currentOrganizationId],
  );

  const displayName = useMemo(() => {
    const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim();
    return fullName || session?.user?.email || 'Utilisateur TimeForma';
  }, [profile, session]);

  const value = useMemo(() => ({
    session,
    user: session?.user || null,
    profile,
    memberships,
    currentMembership,
    currentOrganization: currentMembership?.organization || null,
    organizationRole: currentMembership?.role || null,
    trainerProfile,
    displayName,
    isAuthenticated: Boolean(session?.user),
    loading,
    error,
    setCurrentOrganizationId,
  }), [
    session,
    profile,
    memberships,
    currentMembership,
    trainerProfile,
    displayName,
    loading,
    error,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans AuthProvider');
  }
  return context;
}
