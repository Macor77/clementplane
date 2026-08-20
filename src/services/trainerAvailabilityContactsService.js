import { supabase } from '../lib/supabaseClient';

const CONTACT_FIELDS = `
  id,
  trainer_id,
  organization_id,
  organization_name,
  contact_name,
  email,
  phone,
  created_at,
  updated_at
`;

async function enrichContactsWithReferenceStatus(rows) {
  const contacts = rows || [];
  if (contacts.length === 0) return [];

  const { data, error } = await supabase.rpc(
    'get_my_availability_contact_reference_status',
  );

  if (error) {
    console.error('Erreur de lecture du statut de référencement :', error);
    throw new Error(
      "Impossible de vérifier si vous êtes référencé auprès de vos organismes.",
    );
  }

  const statusByContactId = new Map(
    (data || []).map((row) => [
      row.contact_id,
      Boolean(row.is_referenced),
    ]),
  );

  return contacts.map((contact) => ({
    ...contact,
    is_referenced:
      contact.organization_id
        ? Boolean(statusByContactId.get(contact.id))
        : false,
  }));
}

export async function getMyAvailabilityContacts() {
  const { data, error } = await supabase
    .from('trainer_availability_contacts')
    .select(CONTACT_FIELDS)
    .order('organization_name', { ascending: true })
    .order('contact_name', { ascending: true, nullsFirst: false });

  if (error) {
    console.error('Erreur de lecture du carnet OF :', error);
    throw new Error("Impossible de charger votre carnet d'organismes.");
  }

  return enrichContactsWithReferenceStatus(data || []);
}

export async function createMyAvailabilityContact({
  organizationName,
  contactName,
  email,
  phone,
}) {
  const payload = {
    organization_name: String(organizationName || '').trim(),
    contact_name: String(contactName || '').trim() || null,
    email: String(email || '').trim().toLowerCase(),
    phone: String(phone || '').trim() || null,
  };

  if (!payload.organization_name) {
    throw new Error("Le nom de l'organisme est obligatoire.");
  }
  if (!payload.email) {
    throw new Error("L'adresse e-mail du contact est obligatoire.");
  }

  const { data, error } = await supabase
    .from('trainer_availability_contacts')
    .insert(payload)
    .select(CONTACT_FIELDS)
    .single();

  if (error) {
    console.error('Erreur de création du contact OF :', error);
    if (error.code === '23505') {
      throw new Error("Cette adresse e-mail existe déjà dans votre carnet.");
    }
    if (error.code === '23514') {
      throw new Error('Les informations saisies ne sont pas valides.');
    }
    throw new Error("Impossible d'ajouter cet organisme pour le moment.");
  }

  const [enriched] = await enrichContactsWithReferenceStatus([data]);
  return enriched;
}

export async function updateMyAvailabilityContact({
  contactId,
  organizationName,
  contactName,
  email,
  phone,
}) {
  if (!contactId) {
    throw new Error('Le contact à modifier est obligatoire.');
  }

  const payload = {
    organization_name: String(organizationName || '').trim(),
    contact_name: String(contactName || '').trim() || null,
    email: String(email || '').trim().toLowerCase(),
    phone: String(phone || '').trim() || null,
  };

  if (!payload.organization_name) {
    throw new Error("Le nom de l'organisme est obligatoire.");
  }
  if (!payload.email) {
    throw new Error("L'adresse e-mail du contact est obligatoire.");
  }

  const { data, error } = await supabase
    .from('trainer_availability_contacts')
    .update(payload)
    .eq('id', contactId)
    .select(CONTACT_FIELDS)
    .single();

  if (error) {
    console.error('Erreur de modification du contact OF :', error);
    if (error.code === '23505') {
      throw new Error("Cette adresse e-mail existe déjà dans votre carnet.");
    }
    if (error.code === '23514') {
      throw new Error('Les informations saisies ne sont pas valides.');
    }
    throw new Error("Impossible de modifier cet organisme pour le moment.");
  }

  const [enriched] = await enrichContactsWithReferenceStatus([data]);
  return enriched;
}

export async function deleteMyAvailabilityContact(contactId) {
  if (!contactId) {
    throw new Error('Le contact à supprimer est obligatoire.');
  }

  const { error } = await supabase
    .from('trainer_availability_contacts')
    .delete()
    .eq('id', contactId);

  if (error) {
    console.error('Erreur de suppression du contact OF :', error);
    throw new Error("Impossible de supprimer cet organisme pour le moment.");
  }

  return true;
}
