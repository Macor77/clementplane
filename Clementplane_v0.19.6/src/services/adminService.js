import { supabase } from '../lib/supabaseClient';

function unwrap(result) {
  if (result.error) throw result.error;
  return result.data;
}

export async function isPlatformAdmin() {
  return Boolean(unwrap(await supabase.rpc('is_platform_admin')));
}

export async function getAdminSupportRequests() {
  return unwrap(await supabase.rpc('admin_list_support_requests')) || [];
}

export async function updateAdminSupportRequest(id, { status, priority, internalNotes }) {
  return unwrap(await supabase.rpc('admin_update_support_request', {
    p_id: id,
    p_status: status,
    p_priority: priority,
    p_internal_notes: internalNotes || null,
  }));
}

export async function getAdminAccounts() {
  return unwrap(await supabase.rpc('admin_list_accounts')) || [];
}

export async function getAdminOrganizations() {
  return unwrap(await supabase.rpc('admin_list_organizations')) || [];
}

export async function getAdminDashboardStats() {
  return unwrap(await supabase.rpc('admin_dashboard_stats')) || {};
}

export async function previewFeatureNews(audiences) {
  const { data, error } = await supabase.functions.invoke('send-feature-announcement', {
    body: { action: 'preview', audiences, appBaseUrl: window.location.origin },
  });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error || 'Impossible de calculer les destinataires');
  return data;
}
export async function getFeatureNewsHistory() {
  return unwrap(await supabase.rpc('admin_feature_news_history')) || [];
}
export async function sendFeatureAnnouncement({ subject, message, audiences, test = false }) {
  const { data, error } = await supabase.functions.invoke('send-feature-announcement', { body: {
      action: test ? 'test' : 'send',
      subject,
      message,
      audiences,
      appBaseUrl: window.location.origin,
    } });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error || 'Envoi impossible');
  return data;
}
