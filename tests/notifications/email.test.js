import { it,expect } from 'vitest';
import { prepareResponseEmail } from '../../supabase/functions/_shared/mission-response-email.ts';
function database(failTable){
 const rows={email_logs:[],mission_formateurs:{id:'relation',mission_id:'mission',formateur_id:'trainer'},missions:{id:'mission',organization_id:'org',intitule:'SST <client>',ville:'Louvres'},trainers:{id:'trainer',prenom:'Alice',nom:'Test'},mission_dates:[{date:'2026-12-10',heure_debut:'09:00',heure_fin:'17:00'}],organizations:{name:'OF Test'},organization_members:[{user_id:'manager',role:'manager'},{user_id:'owner',role:'owner'}],profiles:{first_name:'Vincent'}};
 return {auth:{admin:{getUserById:async id=>({data:{user:{email:`${id}@example.invalid`}}})}},from(table){const result={data:rows[table],error:table===failTable?new Error('db'):null};const query={then(resolve){return Promise.resolve(result).then(resolve)}};for(const key of ['select','eq','in','order','limit','single','maybeSingle'])query[key]=()=>query;return query;}};
}
it.each(['accepte','refuse'])('preserves safe email content and the OF owner recipient for %s',async response=>{
 const result=await prepareResponseEmail(database(),{id:'job',relation_id:'relation',response,responded_at:'2026-10-22T12:00:00Z',response_comment:'<script>no</script>'});
 expect(result.emailPayload.to).toEqual([{email:'owner@example.invalid'}]);
 expect(result.emailPayload.htmlContent).toContain('SST &lt;client&gt;');
 expect(result.emailPayload.htmlContent).not.toContain('<script>');
 expect(result.emailPayload.textContent).toContain('10 décembre 2026');
 expect(result.logPayload.metadata.response_status).toBe(response);
 expect(result.logPayload.related_entity_id).toBe('relation');
 if(response==='accepte')expect(result.emailPayload.textContent).toContain('Affecter');
});
it('does not send when prior email history cannot be checked',async()=>{
 await expect(prepareResponseEmail(database('email_logs'),{response:'accepte'})).rejects.toThrow('history unavailable');
});
