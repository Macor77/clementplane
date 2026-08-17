import { supabase } from '../lib/supabaseClient';

export async function getMyAccountDeletionStatus() {
  const { data, error } = await supabase.rpc('get_my_account_deletion_status');
  if (error) throw error;
  return data;
}

export async function deleteMyAccount() {
  const { data, error } = await supabase.functions.invoke('delete-account', {
    body: { confirmation: 'SUPPRIMER' },
  });
  if (error) throw error;
  if (!data?.success) throw new Error(data?.message || 'Suppression impossible.');
  return data;
}
