import { getMyMissionProposals } from './trainerProposalService';
import { getPersonalMissions } from './personalMissionService';
import { personalMissionToAgenda } from '../utils/personalMissions';
export async function getMyAgendaMissions() {
  const [organization,personal]=await Promise.all([getMyMissionProposals(),getPersonalMissions()]);
  return [...organization.map(row=>({...row,origin:'organization'})),...personal.map(personalMissionToAgenda)];
}
export async function getMyAgendaMissionList() {
  return (await getMyAgendaMissions()).filter(row=>['accepte','affecte','annule'].includes(row.status));
}
