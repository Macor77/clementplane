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