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
  copyToSender = false,
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
        copyToSender: Boolean(copyToSender),
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
  const successfulStatuses = new Set(['sent', 'delivered']);

  for (const entry of history) {
    if (
      entry?.trainer_id &&
      successfulStatuses.has(entry?.status) &&
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
  copyToSender = false,
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
        copyToSender: Boolean(copyToSender),
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


export async function sendMissionAssignmentConfirmation({
  missionId,
  trainerId,
  copyToSender = false,
}) {
  if (!missionId || !trainerId) {
    throw new Error(
      'La mission et le formateur sont obligatoires.',
    );
  }

  const { data, error } = await supabase.functions.invoke(
    'send-transactional-email',
    {
      body: {
        type: 'mission_assignment_confirmation',
        missionId,
        trainerId,
        copyToSender: Boolean(copyToSender),
      },
    },
  );

  if (error) {
    console.error(
      "Erreur d'appel du moteur d'e-mails :",
      error,
    );

    throw new Error(
      "Impossible d'envoyer l'e-mail de confirmation d'affectation pour le moment.",
    );
  }

  if (!data?.success) {
    throw new Error(
      data?.message ||
        "Impossible d'envoyer l'e-mail de confirmation d'affectation pour le moment.",
    );
  }

  return data;
}


export async function sendMissionChangeRevalidationEmails({
  requestId,
  copyToSender = false,
}) {
  if (!requestId) {
    throw new Error("La demande de revalidation est obligatoire.");
  }

  const { data, error } = await supabase.functions.invoke(
    'send-transactional-email',
    {
      body: {
        type: 'mission_change_revalidation',
        requestId,
        copyToSender: Boolean(copyToSender),
      },
    },
  );

  if (error) {
    console.error("Erreur d'appel du moteur d'e-mails :", error);
    throw new Error(
      "La mission a été modifiée, mais l'e-mail de revalidation n'a pas pu être envoyé.",
    );
  }

  if (!data?.success) {
    throw new Error(
      data?.message ||
        "La mission a été modifiée, mais l'e-mail de revalidation n'a pas pu être envoyé.",
    );
  }

  return data;
}


export async function sendMissionCancellationEmails({
  missionId,
  copyToSender = false,
}) {
  if (!missionId) {
    throw new Error('La mission est obligatoire.');
  }

  const { data, error } = await supabase.functions.invoke(
    'send-transactional-email',
    {
      body: {
        type: 'mission_cancellation',
        missionId,
        copyToSender: Boolean(copyToSender),
      },
    },
  );

  if (error) {
    console.error("Erreur d'appel du moteur d'e-mails :", error);
    throw new Error(
      "La mission a été annulée, mais les e-mails d'annulation n'ont pas pu être envoyés.",
    );
  }

  if (!data?.success) {
    throw new Error(
      data?.message ||
        "La mission a été annulée, mais les e-mails d'annulation n'ont pas pu être envoyés.",
    );
  }

  return data;
}


export async function sendMissionWithdrawalNotification({
  missionFormateurId,
}) {
  if (!missionFormateurId) {
    throw new Error("L'option est obligatoire.");
  }

  const { data, error } = await supabase.functions.invoke(
    'send-transactional-email',
    {
      body: {
        type: 'mission_withdrawal_notification',
        missionTrainerId: missionFormateurId,
      },
    },
  );

  if (error) {
    console.error("Erreur d'appel du moteur d'e-mails :", error);
    throw new Error(
      "Le désistement est enregistré, mais l'organisme n'a pas pu être prévenu par e-mail.",
    );
  }

  if (!data?.success) {
    throw new Error(
      data?.message ||
        "Le désistement est enregistré, mais l'organisme n'a pas pu être prévenu par e-mail.",
    );
  }

  return data;
}


export async function sendMissionUnassignmentNotification({
  missionId,
  trainerId,
  copyToSender = false,
}) {
  if (!missionId || !trainerId) {
    throw new Error(
      'La mission et le formateur sont obligatoires.',
    );
  }

  const { data, error } = await supabase.functions.invoke(
    'send-transactional-email',
    {
      body: {
        type: 'mission_unassignment_notification',
        missionId,
        trainerId,
        copyToSender: Boolean(copyToSender),
      },
    },
  );

  if (error) {
    console.error(
      "Erreur d'appel du moteur d'e-mails :",
      error,
    );

    throw new Error(
      "La désaffectation est enregistrée, mais l'e-mail d'information n'a pas pu être envoyé.",
    );
  }

  if (!data?.success) {
    throw new Error(
      data?.message ||
        "La désaffectation est enregistrée, mais l'e-mail d'information n'a pas pu être envoyé.",
    );
  }

  return data;
}



export async function sendTrainerAvailabilityShareEmail({
  contactId,
  months,
  message = '',
  copyToSender = false,
}) {
  if (!contactId) {
    throw new Error(
      "Le contact destinataire est obligatoire.",
    );
  }

  if (!Array.isArray(months) || months.length === 0) {
    throw new Error(
      "Sélectionnez au moins un mois à partager.",
    );
  }

  const { data, error } = await supabase.functions.invoke(
    'send-transactional-email',
    {
      body: {
        type: 'trainer_availability_share',
        contactId,
        months,
        message: String(message || '').trim(),
        copyToSender: Boolean(copyToSender),
      },
    },
  );

  if (error) {
    console.error(
      "Erreur d'appel du moteur d'e-mails :",
      error,
    );

    let serverMessage = '';
    try {
      if (error?.context && typeof error.context.json === 'function') {
        const payload = await error.context.json();
        serverMessage = String(payload?.message || '');
      }
    } catch {
      serverMessage = '';
    }

    throw new Error(
      serverMessage ||
        "Impossible d'envoyer vos disponibilités pour le moment.",
    );
  }

  if (!data?.success) {
    throw new Error(
      data?.message ||
        "Impossible d'envoyer vos disponibilités pour le moment.",
    );
  }

  return data;
}
