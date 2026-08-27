import { supabase } from '../lib/supabaseClient';

export async function getMyMissionProposals() {
  const { data, error } = await supabase.rpc(
    'get_my_mission_proposals',
  );

  if (error) {
    throw error;
  }

  const rows = data || [];

  // Une revalidation est une vraie action attendue du formateur.
  // On l'attache donc directement aux propositions/missions afin que
  // « Mes propositions » et « Mes missions » puissent la signaler.
  const changes = await Promise.all(
    rows.map(async (row) => {
      if (!['accepte', 'affecte'].includes(row.status)) {
        return null;
      }

      try {
        return await getMyPendingMissionChange(row.mission_id);
      } catch {
        return null;
      }
    }),
  );

  return rows.map((row, index) => ({
    ...row,
    pending_change: changes[index],
  }));
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
  return (await getMyMissionProposals()).filter((row) =>
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
  comment = '',
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
      p_comment:
        comment || '',
    },
  );

  if (error) {
    throw error;
  }

  return data;
}


export async function getMyTrainerHistory() {
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
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getMyMissionOrganizationContact(missionId) {
  if (!missionId) {
    throw new Error("L'identifiant de la mission est obligatoire.");
  }

  const { data, error } = await supabase.rpc(
    'get_my_mission_organization_contact',
    { p_mission_id: missionId },
  );

  if (error) {
    throw error;
  }

  return data?.[0] || null;
}

export async function getMyMissionProposalHistory() {
  const { data, error } = await supabase.rpc(
    'get_my_mission_proposal_history',
  );

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getMyPendingMissionChange(
  missionId,
) {
  if (!missionId) {
    return null;
  }

  const { data, error } = await supabase.rpc(
    'get_my_pending_mission_change',
    {
      p_mission_id: missionId,
    },
  );

  if (error) {
    throw error;
  }

  return data?.[0] || null;
}

export async function respondToMyMissionChange({
  requestId,
  response,
  comment = '',
}) {
  if (!requestId) {
    throw new Error(
      "L'identifiant de la modification est obligatoire.",
    );
  }

  if (!['accepted', 'refused'].includes(response)) {
    throw new Error(
      'Réponse de modification non reconnue.',
    );
  }

  const { data, error } = await supabase.rpc(
    'respond_to_my_mission_change',
    {
      p_request_id: requestId,
      p_response: response,
      p_comment: comment || '',
    },
  );

  if (error) {
    throw error;
  }

  return data;
}
