import { describe, it, expect } from 'vitest';
import { projectEvents, eventId, localDay } from '../../supabase/functions/_shared/calendar/projection.js';
const row = {origin:'organization', mission_id:'mission-a',status:'proposition_envoyee',proposed_at:'2026-10-01T12:00:00Z',expires_at:'2026-11-01T12:00:00Z',formation:'SST',client:'Client Démo',organization_name:'OF Démo',location:'Paris',mission_notes:'Consigne visible',offered_fee:500,dates:[{date:'2026-10-25',heure_debut:'09:00',heure_fin:'17:00'}]};
const options={now:new Date('2026-10-08T12:00:00Z'),firstDay:'2026-10-08',appUrl:'https://example.test',owner:'connection-a',includeFee:false,includeNotes:false};
const events=(r=row,o={})=>[...projectEvents([r],{...options,...o}).values()];
describe('calendar projection',()=>{
 it.each([['proposition_envoyee','Proposition à répondre','transparent'],['accepte','Option en attente de confirmation','transparent'],['affecte','Mission confirmée','opaque']])('maps %s', (status,title,transparency)=>{
  const [e]=events({...row,status});expect(e.summary).toBe(`${title} — SST`);expect(e.transparency).toBe(transparency);expect(e.visibility).toBe('private');expect(e.attendees).toEqual([]);expect(e.reminders).toEqual({useDefault:false});expect(e.description).not.toContain('500');expect(e.description).toContain('Mission synchronisée depuis Clementplane');expect(e.source.url).toBe('https://example.test/formateur/missions/mission-a');
 });
 it.each(['selectionne','refuse','annule','desiste','mission_pourvue','indisponible_affecte_ailleurs','unknown'])('removes %s',status=>expect(events({...row,status})).toEqual([]));
 it('expires only proposals, requires an actual sent timestamp',()=>{
  expect(events({...row,expires_at:'2026-10-08T12:00:00Z'})).toEqual([]);expect(events({...row,proposed_at:null})).toEqual([]);expect(events({...row,expires_at:null})).toEqual([]);expect(events({...row,status:'accepte',expires_at:'2026-01-01'})).toHaveLength(1);
 });
 it('keeps stable identities through business transitions',async()=>{
  expect(events(row)[0].key).toBe(events({...row,status:'affecte'})[0].key);
  expect(await eventId('a','x',0)).toBe(await eventId('a','x',0));expect(await eventId('a','x',0)).not.toBe(await eventId('b','x',0));expect(await eventId('a','x',1)).not.toBe(await eventId('a','x',0));
 });
 it('preserves historical tracked days but does not initially import history',()=>{
  const past={...row,status:'affecte',dates:[{date:'2026-01-01'}]};expect(events(past)).toEqual([]);expect(events(past,{trackedKeys:new Set(['organization:mission-a:2026-01-01'])})).toHaveLength(1);
 });
 it('projects all-day without inventing a time and uses exclusive next day',()=>{
  const [e]=events({...row,dates:[{date:'2026-12-31'}]});expect(e.start).toEqual({date:'2026-12-31'});expect(e.end).toEqual({date:'2027-01-01'});expect(e.description).toContain('Horaires à préciser');
 });
 it('preserves IANA local time through both DST transitions',()=>{
  for(const date of ['2026-03-29','2026-10-25']){
   const [e]=events({...row,status:'affecte',dates:[{date,heure_debut:'09:00:00',heure_fin:'17:00:00'}]},{firstDay:'2026-01-01'});
   expect(e.start).toEqual({dateTime:`${date}T09:00:00`,timeZone:'Europe/Paris'});
  }
  expect(localDay(new Date('2026-10-08T23:30:00Z'))).toBe('2026-10-09');
 });
 it('uses previous accepted conditions while THIS trainer awaits revalidation',()=>{
  const changed={...row,status:'affecte',formation:'Nouveau',pending_change:{request_status:'pending',response_status:'pending',previous_status:'affecte',previous_mission:{formation:'Ancien',lieu:'Lyon',cout_formateur:100},previous_dates:[{date:'2026-10-20',heure_debut:'10:00',heure_fin:'12:00'}]}};
  const [e]=events(changed);expect(e.summary).toContain('Ancien');expect(e.summary).toContain('Modification à revalider');expect(e.start.dateTime).toContain('2026-10-20');expect(e.transparency).toBe('opaque');expect(e.description).not.toContain('Nouveau');
  expect(events({...changed,pending_change:{...changed.pending_change,response_status:'accepted'}})[0].summary).toContain('Nouveau');
 });
 it('exports personal client/order giver and opt-in fields, then removes them',()=>{
  const r={origin:'personal',mission_id:'personal-a',status:'confirmed',formation:'Incendie',title:'Client Final',client_name:'Commanditaire',fee:600,fee_unit:'day',private_notes:'NOTE PRIVÉE',dates:row.dates};
  const a=events(r,{includeFee:true,includeNotes:true})[0];expect(a.description).toContain('600');expect(a.description).toContain('NOTE PRIVÉE');expect(a.description).toContain('Client Final');expect(a.description).toContain('Commanditaire');
  const b=events(r)[0];expect(b.description).not.toContain('600');expect(b.description).not.toContain('NOTE PRIVÉE');expect(b.source.url).toContain('/personnelles/');expect(events({...r,status:'cancelled'})).toEqual([]);
 });
 it('never exports internal unrecognized fields and escapes HTML',()=>{
  const [e]=events({...row,client:'<img src=x>',prix_vente:999,internal:'SECRET'});expect(e.description).toContain('&lt;img');expect(e.description).not.toContain('SECRET');expect(e.description).not.toContain('999');
 });
 it('aborts the entire projection on corrupt dates instead of pruning known events',()=>expect(()=>events({...row,dates:[{date:'2026-02-30'}]})).toThrow());
});
it('never treats a temporarily empty day list as an intentional cancellation',()=>{
 expect(()=>projectEvents([{...row,status:'affecte',dates:[]}],options)).toThrow('INCOMPLETE_MISSION_DATES');
 expect(()=>projectEvents([{...row,status:'annule',dates:[]}],options)).not.toThrow();
});
