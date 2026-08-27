import { supabase } from '../lib/supabaseClient';

export async function getPublicMissionChange(token) {
  if (!token) throw new Error('Le lien de revalidation est incomplet.');

  const { data, error } = await supabase.rpc(
    'get_public_mission_change',
    { p_token: token },
  );

  if (error) throw error;
  const change = Array.isArray(data) ? data[0] : data;
  if (!change) {
    throw new Error('Cette demande de validation est introuvable ou n’est plus disponible.');
  }
  return change;
}

export async function respondToPublicMissionChange(token, response, comment = '') {
  if (!['accepted', 'refused'].includes(response)) {
    throw new Error('Réponse non reconnue.');
  }

  const { data, error } = await supabase.rpc(
    'respond_to_public_mission_change',
    {
      p_token: token,
      p_response: response,
      p_comment: comment || '',
    },
  );

  if (error) throw error;

  try {
    const { error: notifyError } = await supabase.functions.invoke(
      'notify-mission-change-response',
      {
        body: {
          token,
          response,
        },
      },
    );

    if (notifyError) {
      console.error(
        "La réponse a été enregistrée mais la notification à l'OF a échoué :",
        notifyError,
      );
    }
  } catch (notifyError) {
    console.error(
      "La réponse a été enregistrée mais la notification à l'OF a échoué :",
      notifyError,
    );
  }

  return data;
}
