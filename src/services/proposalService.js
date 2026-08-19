import { supabase } from '../lib/supabaseClient';

const DEFAULT_EXPIRATION_DAYS = 14;

export async function prepareMissionProposal(
  missionFormateurId,
  { expirationDays = DEFAULT_EXPIRATION_DAYS } = {},
) {
  if (!missionFormateurId) {
    throw new Error("L'identifiant de la proposition est obligatoire.");
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expirationDays);

  const { data, error } = await supabase.rpc(
    'create_mission_proposal',
    {
      p_mission_formateur_id: missionFormateurId,
      p_expires_at: expiresAt.toISOString(),
    },
  );

  if (error) {
    throw error;
  }

  return {
    token: data,
    url: buildProposalUrl(data),
    expiresAt: expiresAt.toISOString(),
  };
}

export async function getPublicMissionProposal(token) {
  if (!token) {
    throw new Error('Le lien de proposition est incomplet.');
  }

  const { data, error } = await supabase.rpc(
    'get_public_mission_proposal',
    { p_token: token },
  );

  if (error) {
    throw error;
  }

  const proposal = Array.isArray(data) ? data[0] : data;

  if (!proposal) {
    throw new Error('Cette proposition est introuvable ou n’est plus disponible.');
  }

  return proposal;
}

export async function respondToMissionProposal(
  token,
  response,
  comment = '',
) {
  if (!['accepte', 'refuse'].includes(response)) {
    throw new Error('Réponse non reconnue.');
  }

  const { data, error } = await supabase.rpc(
    'respond_to_mission_proposal',
    {
      p_token: token,
      p_response: response,
      p_comment: comment,
    },
  );

  if (error) {
    throw error;
  }

  return data;
}


export async function notifyOrganizationOfMissionResponse(
  token,
  response,
) {
  if (!token || !['accepte', 'refuse'].includes(response)) {
    return null;
  }

  const { data, error } = await supabase.functions.invoke(
    'notify-mission-response',
    {
      body: {
        token,
        response,
      },
    },
  );

  if (error) {
    console.error(
      "La réponse a été enregistrée, mais la notification e-mail à l'OF n'a pas pu être déclenchée :",
      error,
    );
    return null;
  }

  if (!data?.success) {
    console.error(
      "La réponse a été enregistrée, mais la notification e-mail à l'OF a échoué :",
      data?.message || 'Erreur inconnue.',
    );
    return null;
  }

  return data;
}

export function buildProposalUrl(token) {
  return `${window.location.origin}/proposition/${token}`;
}
