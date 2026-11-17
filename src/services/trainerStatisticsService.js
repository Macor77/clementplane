import { supabase } from '../lib/supabaseClient';
import { validateGoal } from '../utils/trainerStatistics';
const fields = 'month,metric,target';
function validateScope(owner, month) {
  if (!owner) throw new Error('Connexion formateur indisponible.');
  if (!/^20\d{2}-(0[1-9]|1[0-2])-01$/.test(month)) throw new Error('Mois invalide.');
}
export async function getMonthlyGoal(owner, month) {
  validateScope(owner, month);
  const { data, error } = await supabase.from('trainer_activity_goals').select(fields).eq('owner_user_id', owner).eq('month', month).maybeSingle();
  if (error) throw error;
  return data;
}
export async function saveMonthlyGoal(owner, goal) {
  validateScope(owner, goal.month);
  const target = validateGoal(goal.metric, goal.target);
  const { data, error } = await supabase.from('trainer_activity_goals').upsert({ owner_user_id: owner, month: goal.month, metric: goal.metric, target }, { onConflict: 'owner_user_id,month' }).select(fields).single();
  if (error) throw error;
  if (!data || data.month !== goal.month || data.metric !== goal.metric || Number(data.target) !== target) throw new Error('Confirmation serveur absente. Réessayez.');
  return data;
}
export async function deleteMonthlyGoal(owner, month) {
  validateScope(owner, month);
  const { error } = await supabase.from('trainer_activity_goals').delete().eq('owner_user_id', owner).eq('month', month).select('month').maybeSingle();
  if (error) throw error;
}
