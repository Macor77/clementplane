import { supabase } from '../lib/supabaseClient';

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getCurrentUserContext(userId) {
  if (!userId) return null;

  const [profileResult, membershipsResult, trainerResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase
      .from('organization_members')
      .select(`
        id,
        role,
        status,
        joined_at,
        organization:organizations (
          id,
          name,
          legal_name,
          slug,
          logo_url,
          status
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active'),
    supabase.from('trainers').select('id, prenom, nom, statut').eq('user_id', userId).maybeSingle(),
  ]);

  if (profileResult.error) throw profileResult.error;
  if (membershipsResult.error) throw membershipsResult.error;
  if (trainerResult.error) throw trainerResult.error;

  const memberships = (membershipsResult.data || []).filter(
    (membership) => membership.organization,
  );

  return {
    profile: profileResult.data,
    memberships,
    trainerProfile: trainerResult.data,
  };
}
