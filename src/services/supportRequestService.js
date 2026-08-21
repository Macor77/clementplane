import { supabase } from '../lib/supabaseClient';

export async function createSupportRequest({
  audience,
  organizationId = null,
  category,
  message,
  appVersion,
}) {
  const cleanMessage = String(message || '').trim();

  if (!cleanMessage) {
    throw new Error('Votre message est obligatoire.');
  }

  if (cleanMessage.length > 5000) {
    throw new Error('Votre message est trop long (5 000 caractères maximum).');
  }

  const { data, error } = await supabase.rpc('create_support_request', {
    p_audience: audience,
    p_organization_id: organizationId || null,
    p_category: String(category || '').trim(),
    p_message: cleanMessage,
    p_app_version: String(appVersion || '').trim() || null,
  });

  if (error) {
    console.error('Erreur de création de la demande Formaplane :', error);
    throw new Error("Impossible d'enregistrer votre demande pour le moment.");
  }

  const request = Array.isArray(data) ? data[0] : data;

  if (!request?.id) {
    throw new Error("Impossible d'enregistrer votre demande pour le moment.");
  }

  const notification = await supabase.functions.invoke(
    'send-transactional-email',
    {
      body: {
        type: 'support_request_notification',
        supportRequestId: request.id,
      },
    },
  );

  const notificationSent =
    !notification.error && notification.data?.success === true;

  if (!notificationSent) {
    console.error(
      "La demande a été enregistrée mais la notification e-mail n'a pas pu être envoyée :",
      notification.error || notification.data,
    );
  }

  return {
    ...request,
    notificationSent,
  };
}
