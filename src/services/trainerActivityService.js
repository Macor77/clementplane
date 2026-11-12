import { personalMissionToAgenda } from '../utils/personalMissions';
import { supabase } from '../lib/supabaseClient';
import { validateActivity } from '../utils/trainerActivity';
const reportFields = 'id,trainer_id,mission_id,personal_mission_id,agreed_fee,declared_fee,tax_basis,observations,sessions,revision,updated_at';
async function allRows(query) {
  const rows = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await query().range(from, from + 499);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < 500) return rows;
  }
}
export async function getMyActivityReports(trainerId) {
  if (!trainerId) throw new Error('Profil formateur indisponible.');
  return allRows(() => supabase.from('trainer_activity_reports').select(reportFields).eq('trainer_id', trainerId).order('id'));
}
export async function getActivityReport(origin, missionId, trainerId) {
  if (!trainerId) throw new Error('Profil formateur indisponible.');
  const { data: report, error } = await supabase.from('trainer_activity_reports').select(reportFields).eq('trainer_id', trainerId).eq(origin === 'personal' ? 'personal_mission_id' : 'mission_id', missionId).maybeSingle();
  if (error) throw error;
  if (!report) return null;
  const { data: privateData, error: privateError } = await supabase.from('trainer_activity_private').select('expenses,expense_details,kilometers,difficulties').eq('report_id', report.id).single();
  if (privateError) throw privateError;
  return { report, private: privateData };
}
export async function getOrganizationActivityReports(missionId) {
  return allRows(() => supabase.from('trainer_activity_reports').select(reportFields).eq('mission_id', missionId).order('id'));
}
export async function saveActivityReport(origin, missionId, revision, mutationId, input) {
  const p_data = validateActivity(input);
  const { data, error } = await supabase.rpc('save_trainer_activity_report', { p_origin: origin, p_mission_id: missionId, p_revision: revision, p_mutation_id: mutationId, p_data });
  if (error) {
    if (error.message?.includes('REPORT_CONFLICT')) throw new Error('Ce bilan a changé dans une autre fenêtre. Vos saisies sont conservées. Rechargez la page après les avoir copiées pour comparer les versions.');
    throw new Error('Enregistrement impossible. Vos saisies sont conservées ; vérifiez votre connexion puis réessayez.');
  }
  if (!data?.report?.revision) throw new Error('Confirmation serveur absente. Vos saisies sont conservées ; réessayez.');
  return data;
}

// Paginate both sources: statistics must never silently stop at the API row limit.
export async function getActivityMissions() {
  const [organization, personal] = await Promise.all([
    allRows(() => supabase.rpc('get_my_mission_proposals').order('mission_id')),
    allRows(() => supabase.from('trainer_personal_missions').select('id,title,formation,dates,fee,fee_unit,status').order('id')),
  ]);
  return [...organization.map(m => ({ ...m, origin: 'organization' })), ...personal.map(personalMissionToAgenda)];
}
export async function getRetainedReportMission(reportId, trainerId) {
  const { data, error } = await supabase.from('trainer_activity_reports').select(reportFields).eq('id', reportId).eq('trainer_id', trainerId).single();
  if (error) throw error;
  return { mission_id: data.mission_id || data.personal_mission_id, origin: data.personal_mission_id ? 'personal' : 'organization',
    mission_title: data.sessions[0]?.formation || 'Bilan conservé', dates: [], retained: true };
}
