import { supabase } from '../lib/supabaseClient';

export async function getEquipmentCatalog() {
  const { data, error } = await supabase
    .from('equipment_catalog')
    .select('id, name, normalized_name')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function addEquipmentToCatalog(name) {
  const { data, error } = await supabase.rpc(
    'add_equipment_to_catalog',
    { p_name: name },
  );

  if (error) throw error;
  return data?.[0] || null;
}
