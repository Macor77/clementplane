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

export function buildProposalUrl(token) {
  return `${window.location.origin}/proposition/${token}`;
}
