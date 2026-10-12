import {describe,it,expect,vi} from 'vitest';
import {calendarName,renameLegacyCalendar} from '../../supabase/functions/_shared/calendar/naming.js';
import {shouldInviteGoogle} from '../../src/utils/googleCalendarInvitation.js';

describe('calendar identity',()=>{
 it('uses the account name with trainer fallback and no email fallback',()=>{
  expect(calendarName({first_name:' Vincent ',last_name:'Macor'},{})).toBe('Vincent Macor — Clementplane');
  expect(calendarName(null,{prenom:'Julie',nom:'Martin'})).toBe('Julie Martin — Clementplane');
  expect(calendarName(null,null)).toBe('Clementplane');
 });
 it('renames a legacy calendar in place, leaving events and sharing untouched',async()=>{
  const fetch=vi.fn(async(_url,options)=>Response.json(options.method==='PATCH'?{id:'same-id'}:{summary:'Clementplane'}));
  await renameLegacyCalendar({fetch,token:'token',calendarId:'same-id',name:'Julie Martin — Clementplane'});
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(fetch.mock.calls[1][0]).toBe('https://www.googleapis.com/calendar/v3/calendars/same-id');
  expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({summary:'Julie Martin — Clementplane'});
 });
 it('preserves a calendar name chosen by the trainer',async()=>{
  const fetch=vi.fn(async()=>Response.json({summary:'Mes formations'}));
  await renameLegacyCalendar({fetch,token:'token',calendarId:'same-id',name:'Julie Martin — Clementplane'});
  expect(fetch).toHaveBeenCalledTimes(1);
 });
});
describe('Google invitation',()=>{
 const status={mode:'public',status:'disconnected'};
 it('invites after a personal or accepted mission',()=>{
  expect(shouldInviteGoogle(status,[{status:'affecte',origin:'personal'}],false)).toBe(true);
  expect(shouldInviteGoogle(status,[{status:'accepte'}],false)).toBe(true);
 });
 it('does not invite for unanswered proposals, dismissed invitations or connected accounts',()=>{
  expect(shouldInviteGoogle(status,[{status:'proposition_envoyee'}],false)).toBe(false);
  expect(shouldInviteGoogle(status,[{status:'affecte'}],true)).toBe(false);
  expect(shouldInviteGoogle({...status,status:'active'},[{status:'affecte'}],false)).toBe(false);
  expect(shouldInviteGoogle({...status,mode:'disabled'},[{status:'affecte'}],false)).toBe(false);
 });
});
