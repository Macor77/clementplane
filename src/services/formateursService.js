import { supabase } from "../lib/supabaseClient";

const TABLE = "trainers";

export async function getFormateurs() {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function deleteFormateur(id) {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function updateFormateurGps(id, latitude, longitude) {
  const { error } = await supabase
    .from(TABLE)
    .update({ latitude, longitude })
    .eq("id", id);

  if (error) throw error;
}