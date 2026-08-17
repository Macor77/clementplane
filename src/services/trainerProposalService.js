import { supabase } from '../lib/supabaseClient';

export async function getMyMissionProposals() {
  const { data, error } = await supabase.rpc(
    'get_my_mission_proposals',
  );

  if (error) {
    throw error;
  }

  return data || [];
}

export async function respondToMyMissionProposal({
  missionFormateurId,
  response,
  comment = '',
}) {
  if (!missionFormateurId) {
    throw new Error(
      "L'identifiant de la proposition est obligatoire.",
    );
  }

  if (!['accepte', 'refuse'].includes(response)) {
    throw new Error(
      'Réponse non reconnue.',
    );
  }

  const { data, error } = await supabase.rpc(
    'respond_to_my_mission_proposal',
    {
      p_mission_formateur_id:
        missionFormateurId,

      p_response:
        response,

      p_comment:
        comment || '',
    },
  );

  if (error) {
    throw error;
  }

  return data;
}

export async function getMyTrainerMissions() {
  const rows = await getMyMissionProposals();

  return rows.filter((row) =>
    ['accepte', 'affecte', 'annule'].includes(row.status),
  );
}

export async function getMyTrainerMissionById(missionId) {
  if (!missionId) {
    throw new Error("L'identifiant de la mission est obligatoire.");
  }

  const rows = await getMyMissionProposals();
  const mission = rows.find((row) => row.mission_id === missionId);

  if (!mission) {
    throw new Error('Mission introuvable ou inaccessible.');
  }

  return mission;
}


export async function getMyTrainerMissionHistory(
  missionId,
) {
  if (!missionId) {
    throw new Error(
      "L'identifiant de la mission est obligatoire.",
    );
  }

  const { data, error } = await supabase
    .from('mission_trainer_history')
    .select(`
      id,
      mission_id,
      trainer_id,
      mission_formateur_id,
      action,
      previous_status,
      new_status,
      actor_type,
      actor_display_name,
      actor_organization_name,
      details,
      created_at
    `)
    .eq('mission_id', missionId)
    .order('created_at', {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  /*
   * La RLS de mission_trainer_history garantit
   * qu'un formateur ne reçoit que les événements
   * liés à sa propre fiche formateur.
   *
   * Les interactions de l'OF avec d'autres
   * formateurs sur la même mission ne sont donc
   * jamais renvoyées au navigateur.
   */
  return data || [];
}


export async function withdrawFromMyMissionOption({
  missionFormateurId,
  availabilityByDay = {},
}) {
  if (!missionFormateurId) {
    throw new Error(
      "L'identifiant de l'option est obligatoire.",
    );
  }

  const { data, error } = await supabase.rpc(
    'withdraw_from_my_mission_option',
    {
      p_mission_formateur_id:
        missionFormateurId,
      p_availability_by_day:
        availabilityByDay,
    },
  );

  if (error) {
    throw error;
  }

  return data;
}
