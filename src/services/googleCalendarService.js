import {supabase} from '../lib/supabaseClient';
const messages={SYNC_BUSY:'Une synchronisation est en cours. Réessayez dans quelques instants.',INVALID_OAUTH_STATE:'Cette connexion a expiré ou a été ouverte dans un autre navigateur. Recommencez depuis cet écran.',WRONG_GOOGLE_ACCOUNT:'Reconnectez le même compte Google que celui affiché.',GOOGLE_ACCOUNT_ALREADY_LINKED:'Ce compte Google est déjà associé à un autre compte Clementplane.',MISSING_CALENDAR_SCOPE:'L’autorisation du calendrier Clementplane est nécessaire. Recommencez et accordez-la.',MISSING_REFRESH_TOKEN:'Google n’a pas accordé l’accès durable. Recommencez la connexion.',CALENDAR_CREATION_UNCERTAIN:'La création du calendrier doit être vérifiée. Contactez le support avant de recommencer.',NOT_AVAILABLE:'La synchronisation Google n’est pas encore disponible pour ce compte.'};
export async function calendarAction(action,values={}){
 const {data,error}=await supabase.functions.invoke('google-calendar',{body:{action,...values}});
 if(error||data?.error){
  let code=data?.error;try{if(!code&&error?.context)code=(await error.context.json()).error;}catch{/* Generic message below. */}
  throw new Error(messages[code]||'Impossible de joindre la synchronisation. Réessayez dans quelques instants.');
 }
 return data;
}
export const googleCalendarEnabled=import.meta.env.VITE_GOOGLE_CALENDAR_ENABLED==='true';
