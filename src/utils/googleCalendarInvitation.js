export function shouldInviteGoogle(status,missions,dismissed){
 return !dismissed&&status?.mode!=='disabled'&&status?.status==='disconnected'
  &&missions.some(mission=>['accepte','affecte'].includes(mission.status));
}
