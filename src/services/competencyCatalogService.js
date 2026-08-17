import { supabase } from '../lib/supabaseClient';

export async function getCompetencyCatalog() {
  const { data, error } = await supabase
    .from('competency_catalog')
    .select('id, name, normalized_name')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function addCompetencyToCatalog(name) {
  const { data, error } = await supabase.rpc(
    'add_competency_to_catalog',
    { p_name: name },
  );

  if (error) throw error;
  return data?.[0] || null;
}
