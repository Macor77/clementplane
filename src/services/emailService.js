import { supabase } from '../lib/supabaseClient';

export async function sendInfrastructureTestEmail() {
  const { data, error } = await supabase.functions.invoke(
    'send-transactional-email',
    {
      body: {
        type: 'infrastructure_test',
      },
    },
  );

  if (error) {
    console.error("Erreur d'appel du moteur d'e-mails :", error);
    throw new Error(
      "Impossible d'envoyer l'e-mail de test pour le moment.",
    );
  }

  if (!data?.success) {
    throw new Error(
      data?.message ||
        "Impossible d'envoyer l'e-mail de test pour le moment.",
    );
  }

  return data;
}

export async function sendTrainerClaimInvitation({
  trainerId,
  organizationId,
}) {
  if (!trainerId || !organizationId) {
    throw new Error('Organisation et formateur obligatoires.');
  }

  const { data, error } = await supabase.functions.invoke(
    'send-transactional-email',
    {
      body: {
        type: 'trainer_claim_invitation',
        trainerId,
        organizationId,
      },
    },
  );

  if (error) {
    console.error("Erreur d'appel du moteur d'e-mails :", error);
    throw new Error(
      "Impossible d'envoyer l'invitation pour le moment.",
    );
  }

  if (!data?.success) {
    throw new Error(
      data?.message ||
        "Impossible d'envoyer l'invitation pour le moment.",
    );
  }

  return data;
}


export async function getTrainerInvitationHistory({
  organizationId,
  trainerId = null,
}) {
  if (!organizationId) {
    return [];
  }

  const { data, error } = await supabase.rpc(
    'get_trainer_invitation_history',
    {
      p_organization_id: organizationId,
      p_trainer_id: trainerId || null,
    },
  );

  if (error) {
    console.error("Erreur de lecture de l'historique des invitations :", error);
    throw new Error(
      "Impossible de charger l'historique des invitations.",
    );
  }

  return Array.isArray(data) ? data : [];
}

export function getLatestSuccessfulInvitationByTrainer(history = []) {
  const latestByTrainer = {};

  for (const entry of history) {
    if (
      entry?.trainer_id &&
      entry?.status === 'sent' &&
      entry?.sent_at &&
      !latestByTrainer[entry.trainer_id]
    ) {
      latestByTrainer[entry.trainer_id] = entry;
    }
  }

  return latestByTrainer;
}

export function isInvitationCoolingDown(invitation, hours = 72) {
  if (!invitation?.sent_at) return false;

  const sentAt = new Date(invitation.sent_at).getTime();
  if (!Number.isFinite(sentAt)) return false;

  return Date.now() - sentAt < hours * 60 * 60 * 1000;
}

export function formatInvitationRelativeLabel(invitation) {
  if (!invitation?.sent_at) return '';

  const sentAt = new Date(invitation.sent_at).getTime();
  if (!Number.isFinite(sentAt)) return '';

  const elapsed = Math.max(0, Date.now() - sentAt);
  const days = Math.floor(elapsed / (24 * 60 * 60 * 1000));

  if (days === 0) return "Invité aujourd’hui";
  if (days === 1) return "Invité hier";
  return `Invité il y a ${days} j`;
}


export async function sendMissionProposalEmail({
  missionTrainerId,
  isReminder = false,
}) {
  if (!missionTrainerId) {
    throw new Error(
      "La proposition de mission est obligatoire.",
    );
  }

  const { data, error } = await supabase.functions.invoke(
    'send-transactional-email',
    {
      body: {
        type: isReminder
          ? 'mission_proposal_reminder'
          : 'mission_proposal',
        missionTrainerId,
      },
    },
  );

  if (error) {
    console.error(
      "Erreur d'appel du moteur d'e-mails :",
      error,
    );

    throw new Error(
      "Impossible d'envoyer la proposition par e-mail pour le moment.",
    );
  }

  if (!data?.success) {
    throw new Error(
      data?.message ||
        "Impossible d'envoyer la proposition par e-mail pour le moment.",
    );
  }

  return data;
}
