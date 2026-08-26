import { supabase } from '../lib/supabaseClient';
import {
  createMyAvailabilityContact,
  deleteMyAvailabilityContact,
  getMyAvailabilityContacts,
  updateMyAvailabilityContact,
} from './trainerAvailabilityContactsService';

export {
  createMyAvailabilityContact,
  deleteMyAvailabilityContact,
  updateMyAvailabilityContact,
};

export {
  formatNextInvitationLabel,
  getOrganizationInvitationTarget,
  isOrganizationInvitationCoolingDown,
} from '../utils/trainerOrganizationInvitation';

export async function getMyTrainerOrganizations() {
  return getMyAvailabilityContacts();
}

export async function sendTrainerOrganizationInvitation(contactId) {
  if (!contactId) {
    throw new Error("L'organisme à inviter est obligatoire.");
  }

  const { data, error } = await supabase.functions.invoke(
    'send-transactional-email',
    {
      body: {
        type: 'trainer_organization_invitation',
        contactId,
      },
    },
  );

  if (error) {
    console.error("Erreur d'appel de l'invitation OF :", error);
    throw new Error("Impossible d'envoyer l'invitation pour le moment.");
  }

  if (!data?.success) {
    const nextInvitationAt = data?.nextInvitationAt || null;
    const invitationError = new Error(
      data?.message || "Impossible d'envoyer l'invitation pour le moment.",
    );
    invitationError.code = data?.code || '';
    invitationError.nextInvitationAt = nextInvitationAt;
    throw invitationError;
  }

  return data;
}

export async function getPublicTrainerOrganizationInvitation(token) {
  if (!token) return null;

  const { data, error } = await supabase.rpc(
    'get_public_trainer_organization_invitation',
    { p_token: token },
  );

  if (error) {
    console.error("Impossible de lire l'invitation OF :", error);
    throw new Error("Cette invitation n'est pas disponible.");
  }

  if (Array.isArray(data)) {
    return data[0] || null;
  }

  return data || null;
}
