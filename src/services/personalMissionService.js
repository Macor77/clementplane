import { supabase } from '../lib/supabaseClient';
import { validatePersonalMission } from '../utils/personalMissions';
const fields = 'id,trainer_id,title,formation,client_name,location,dates,private_notes,fee,fee_unit,status,created_at,updated_at,cancelled_at,revision';
export async function getPersonalMissions() {
  const {data,error}=await supabase.from('trainer_personal_missions').select(fields).order('created_at',{ascending:false});
  if(error) throw error;
  return data || [];
}
export async function getPersonalMission(id) {
  const {data,error}=await supabase.from('trainer_personal_missions').select(fields).eq('id',id).single();
  if(error) throw new Error('Mission introuvable ou inaccessible.');
  return data;
}
export async function savePersonalMission({id,revision,input}) {
  const payload=validatePersonalMission(input);
  // UUID stable : une nouvelle tentative ne crée jamais un second enregistrement.
  let query = revision == null
    ? supabase.from('trainer_personal_missions').insert({...payload,id})
    : supabase.from('trainer_personal_missions').update(payload).eq('id',id).eq('revision',revision).eq('status','confirmed');
  const {data,error}=await query.select(fields).single();
  if(error) {
    if(error.code === '23505') throw new Error('Cette mission a déjà été enregistrée. Consultez Mes missions avant de réessayer.');
    if(error.code === 'PGRST116') throw new Error('La mission a changé dans une autre fenêtre. Rechargez-la avant de modifier à nouveau.');
    throw new Error('Enregistrement impossible. Vos saisies sont conservées ; vérifiez votre connexion puis réessayez.');
  }
  return data;
}
export async function cancelPersonalMission(id,revision) {
  const {data,error}=await supabase.from('trainer_personal_missions').update({status:'cancelled'}).eq('id',id).eq('revision',revision).select(fields).single();
  if(error) throw new Error('Annulation impossible. Rechargez la mission et réessayez.');
  return data;
}
